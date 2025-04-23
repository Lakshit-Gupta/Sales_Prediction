import os
import pandas as pd
import numpy as np
import torch
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import logging

# === Setup ===
app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # Replace with a secure key
jwt = JWTManager(app)

UPLOAD_FOLDER = 'Uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'xlsx'}

logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# === In-memory storage ===
users = {}  # {email: {"hashed_password": str, "store_name": str}}
user_predictions = {}  # {email: [{item_name, store_name, forecast, suggestions, timestamp, filename}]}

# === Load Model ===
try:
    model = torch.jit.load("tft_traced_model.pt")
    model.eval()
    logger.info("TFT model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load TFT model: {str(e)}")
    raise

# === Utilities ===
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def normalize_email(email):
    """Replace special characters in email for filename safety."""
    return email.replace('@', '_').replace('.', '_')

def validate_excel_data(df):
    required_columns = ['date', 'store_nbr', 'item_nbr', 'history', 'transactions', 'onpromotion', 'is_holiday']
    return all(col in df.columns for col in required_columns)

# === Endpoints ===
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        store_name = data.get('store_name', 'Unknown Store')
        if not email or not password:
            logger.error("Registration failed: Missing email or password")
            return jsonify({"error": "Email and password are required"}), 400
        if email in users:
            logger.error(f"Registration failed: User {email} already exists")
            return jsonify({"error": "User already exists"}), 400
        users[email] = {"hashed_password": generate_password_hash(password), "store_name": store_name}
        logger.info(f"User registered: {email} with store {store_name}")
        return jsonify({"message": "User registered successfully"}), 200
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            logger.error("Login failed: Missing email or password")
            return jsonify({"error": "Email and password are required"}), 400
        user_data = users.get(email)
        if not user_data or not check_password_hash(user_data['hashed_password'], password):
            logger.error(f"Login failed: Invalid credentials for {email}")
            return jsonify({"error": "Invalid credentials"}), 401
        access_token = create_access_token(identity=email, expires_delta=timedelta(hours=6))
        logger.info(f"Login successful: {email}")
        return jsonify({"access_token": access_token}), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    try:
        user_email = get_jwt_identity()
        user_data = users.get(user_email, {})
        store_name = user_data.get("store_name", "Unknown Store")
        logger.info(f"User info retrieved for {user_email}: {store_name}")
        return jsonify({"username": user_email, "store_name": store_name}), 200
    except Exception as e:
        logger.error(f"User error: {str(e)}")
        return jsonify({"error": f"Error retrieving user info: {str(e)}"}), 500

@app.route('/upload', methods=['POST'])
@jwt_required()
def upload():
    try:
        user_email = get_jwt_identity()
        normalized_email = normalize_email(user_email)
        if 'file' not in request.files:
            logger.error(f"Upload failed for {user_email}: No file part")
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            logger.error(f"Upload failed for {user_email}: No selected file")
            return jsonify({"error": "No selected file"}), 400
        if file and allowed_file(file.filename):
            safe_time = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"upload_{normalized_email}_{safe_time}.xlsx"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            df = pd.read_excel(filepath)
            row_count = len(df)
            logger.info(f"File uploaded for {user_email}: {filename}, rows: {row_count}")
            return jsonify({
                "message": "File uploaded successfully",
                "filename": filename,
                "row_count": row_count
            }), 200
        logger.error(f"Upload failed for {user_email}: Invalid file type")
        return jsonify({"error": "Invalid file format. Only .xlsx files are allowed"}), 400
    except Exception as e:
        logger.error(f"Upload error for {user_email}: {str(e)}")
        return jsonify({"error": f"Failed to upload file: {str(e)}"}), 500

@app.route('/forecast', methods=['POST'])
@jwt_required()
def forecast():
    user_email = get_jwt_identity()
    normalized_email = normalize_email(user_email)
    try:
        logger.info(f"Received /forecast request from user: {user_email}")
        data = request.get_json()
        forecast_days = min(data.get('forecast_days', 7), 30)
        custom_is_holiday = data.get('is_holiday', None)
        custom_onpromotion = data.get('onpromotion', None)
        store_name = data.get('store_name', users.get(user_email, {}).get('store_name', 'Unknown Store'))
        item_name = data.get('item_name', 'Item 1')

        # Find uploaded files
        user_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(f"upload_{normalized_email}_") and f.endswith('.xlsx')]
        logger.info(f"Files found for {user_email} in {os.path.abspath(UPLOAD_FOLDER)}: {user_files}")
        if not user_files:
            logger.error(f"No uploaded files found for {user_email}")
            return jsonify({"error": "No uploaded files found for this user"}), 404

        # Use the most recent file
        latest_file = max([os.path.join(UPLOAD_FOLDER, f) for f in user_files], key=os.path.getctime)
        logger.info(f"Using file for forecast: {latest_file}")
        df = pd.read_excel(latest_file)
        if not validate_excel_data(df):
            logger.error(f"Invalid data in file: {latest_file}")
            return jsonify({"error": "Invalid data in uploaded file"}), 400

        # Preprocess data
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df.fillna({
            'store_nbr': 1,
            'item_nbr': 1,
            'onpromotion': 0,
            'is_holiday': 0,
            'transactions': 0,
            'history': 0
        }, inplace=True)
        df = df.astype({
            'store_nbr': int,
            'item_nbr': int,
            'onpromotion': int,
            'is_holiday': int,
            'transactions': float,
            'history': float
        })

        store_nbr = df['store_nbr'].iloc[-1]
        item_nbr = df['item_nbr'].iloc[-1]
        history = df['history'].tail(30).tolist()
        transactions = df['transactions'].tail(37).tolist()

        is_holiday = custom_is_holiday if custom_is_holiday and len(custom_is_holiday) >= 37 else df['is_holiday'].tail(37).tolist()
        onpromotion = custom_onpromotion if custom_onpromotion and len(custom_onpromotion) >= 37 else df['onpromotion'].tail(37).tolist()

        # Extend arrays
        transactions = transactions[-37:] + [transactions[-1]] * 30
        is_holiday = is_holiday[-37:] + [is_holiday[-1]] * 30
        onpromotion = onpromotion[-37:] + [onpromotion[-1]] * 30

        predictions = {"p10": [], "p50": [], "p90": []}
        current_history = history.copy()
        current_onpromotion = onpromotion.copy()
        current_is_holiday = is_holiday.copy()
        current_transactions = transactions.copy()

        # Generate forecasts
        for day in range(forecast_days):
            encoder_len = 30
            decoder_len = 1

            history_tensor = torch.tensor(current_history[-encoder_len:], dtype=torch.float).unsqueeze(0)
            transactions_tensor = torch.tensor(current_transactions[day:37+day], dtype=torch.float).unsqueeze(0)
            time_idx = torch.arange(day, 37+day, dtype=torch.float).unsqueeze(0)
            day_of_week = torch.tensor([(i % 7) for i in range(day, 37+day)], dtype=torch.float).unsqueeze(0)
            month = torch.tensor([((i % 12) + 1) for i in range(day, 37+day)], dtype=torch.float).unsqueeze(0)
            dummy = [torch.zeros(1, 37, dtype=torch.float) for _ in range(5)]

            encoder_cont = torch.stack([
                history_tensor[:, :encoder_len],
                transactions_tensor[:, :encoder_len],
                time_idx[:, :encoder_len],
                day_of_week[:, :encoder_len],
                month[:, :encoder_len],
                *[d[:, :encoder_len] for d in dummy]
            ], dim=-1)

            decoder_cont = torch.stack([
                history_tensor[:, -1:],
                transactions_tensor[:, encoder_len:encoder_len+decoder_len],
                time_idx[:, encoder_len:encoder_len+decoder_len],
                day_of_week[:, encoder_len:encoder_len+decoder_len],
                month[:, encoder_len:encoder_len+decoder_len],
                *[d[:, encoder_len:encoder_len+decoder_len] for d in dummy]
            ], dim=-1)

            store_tensor = torch.tensor([[store_nbr] * 37], dtype=torch.long)
            item_tensor = torch.tensor([[item_nbr] * 37], dtype=torch.long)
            promo_tensor = torch.tensor(current_onpromotion[day:37+day], dtype=torch.long).unsqueeze(0)
            holiday_tensor = torch.tensor(current_is_holiday[day:37+day], dtype=torch.long).unsqueeze(0)

            encoder_cat = torch.stack([
                store_tensor[:, :encoder_len],
                item_tensor[:, :encoder_len],
                promo_tensor[:, :encoder_len],
                holiday_tensor[:, :encoder_len]
            ], dim=-1)

            decoder_cat = torch.stack([
                store_tensor[:, encoder_len:encoder_len+decoder_len],
                item_tensor[:, encoder_len:encoder_len+decoder_len],
                promo_tensor[:, encoder_len:encoder_len+decoder_len],
                holiday_tensor[:, encoder_len:encoder_len+decoder_len]
            ], dim=-1)

            history_array = torch.tensor(current_history, dtype=torch.float)
            target_mean = history_array.mean()
            target_std = history_array.std() if history_array.std() > 0 else torch.tensor(1.0)
            target_scale = torch.tensor([[target_mean, target_std]], dtype=torch.float)

            model_input = {
                "encoder_cont": encoder_cont,
                "decoder_cont": decoder_cont,
                "encoder_cat": encoder_cat,
                "decoder_cat": decoder_cat,
                "encoder_lengths": torch.tensor([encoder_len]),
                "decoder_lengths": torch.tensor([decoder_len]),
                "target_scale": target_scale
            }

            with torch.no_grad():
                output = model(model_input)

            p10, p50, p90 = output[0][:, :, 1].item(), output[0][:, :, 3].item(), output[0][:, :, 5].item()
            predictions["p10"].append(p10)
            predictions["p50"].append(p50)
            predictions["p90"].append(p90)
            current_history.append(p50)
            current_history = current_history[1:]

        suggestions = [{
            "type": "stock_adjustment",
            "message": f"Prepare stock for ~{round(np.mean(predictions['p50']))} units/day of {item_name} at {store_name}.",
            "confidence": 0.9
        }]

        # Save predictions
        user_predictions.setdefault(user_email, []).append({
            "item_name": item_name,
            "store_name": store_name,
            "forecast": predictions,
            "suggestions": suggestions,
            "timestamp": datetime.now().isoformat(),
            "filename": os.path.basename(latest_file)
        })
        logger.info(f"Forecast saved for {user_email}: {item_name} at {store_name}")

        return jsonify({
            "forecast": predictions,
            "suggestions": suggestions,
            "store_name": store_name,
            "item_name": item_name
        }), 200

    except Exception as e:
        logger.error(f"Forecast error for {user_email}: {str(e)}")
        return jsonify({"error": f"Error generating forecast: {str(e)}"}), 500

@app.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    try:
        user_email = get_jwt_identity()
        predictions = user_predictions.get(user_email, [])
        logger.info(f"Retrieved {len(predictions)} predictions for {user_email}")
        return jsonify({"predictions": predictions}), 200
    except Exception as e:
        logger.error(f"Predictions error for {user_email}: {str(e)}")
        return jsonify({"error": f"Error retrieving predictions: {str(e)}"}), 500

# === Run ===
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

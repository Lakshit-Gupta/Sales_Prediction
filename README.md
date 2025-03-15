# 📈 Temporal Fusion Transformer (TFT) for Sales Prediction

This project utilizes the **Temporal Fusion Transformer (TFT)** model for accurate sales forecasting. By leveraging **multi-horizon forecasting**, attention mechanisms, and advanced feature engineering, the model aims to provide precise predictions across different stores and products. This project was inspired by the **Microsoft Hackathon**.

---

## 💻 Run Locally

Clone the project:

```bash
git clone https://github.com/Lakshit-Gupta/Sales_Prediction.git
```

Go to the project directory:

```bash
cd Sales_Prediction
```

## 📥 Dataset and Model Download
The dataset and pre-trained models for this project are available in the **[Releases](https://github.com/Lakshit-Gupta/Sales_Prediction/releases)** section. Click the link to download the necessary files.

## ⚙️ Resolving Dependencies
If using Anaconda, use the following command in the base (root) terminal to install dependencies:

```bash
conda env create -f environment.yaml
```
```bash
conda activate sales_prediction
```

## 🚀 How to Run the Application
Run the main application script using the following command:

```bash
python main.py
```

---

## 🐳 **Docker Setup**

### CPU Version

```bash
docker pull lakshitgupta/sales_prediction:v1.0
```
```bash
docker run -p 8501:8501 lakshitgupta/sales_prediction:v1.0
```
Then go to:
```bash
localhost:8501
```

### GPU Version

```bash
docker pull lakshitgupta/sales_prediction_gpu:v1.0
```
```bash
docker run --gpus all -p 8501:8501 sales_prediction_gpu:v1.0
```
Then go to:
```bash
localhost:8501
```

---

## 📂 Dataset Structure

The dataset contains historical sales data, including:

- **Store ID**: Unique identifier for each store.
- **Item ID**: Unique identifier for each product.
- **Time Index**: Temporal order of sales data.
- **Sales**: Target variable to be predicted.
- **Additional Features**: Promotional data, seasonal effects, and external covariates.

---

## 🏗️ Model Architecture

This project implements the **Temporal Fusion Transformer (TFT)**, which is a state-of-the-art deep learning model for time-series forecasting.

- **Multi-Horizon Forecasting**: Predicts future sales for different time periods.
- **Attention Mechanisms**: Identifies key patterns in the data.
- **Feature Engineering**: Uses categorical and continuous variables for better predictions.
- **Optimization**: AdamW optimizer with learning rate decay.

### 🔹 Model Summary

```
Input: (Batch Size, Time Steps, Features)
Temporal Fusion Transformer (TFT) Model
Multi-Head Attention Mechanism
Gated Residual Networks (GRN)
Variable Selection Networks (VSN)
Output: Future Sales Predictions
```

---

## 🎯 Training & Optimization

- **Optimizer Choices:** AdamW (Recommended), RMSprop, SGD with Momentum
- **Loss Functions Explored:**
  - Quantile Loss (for multi-step forecasting)
  - Mean Squared Error (MSE)
  - Huber Loss (to handle outliers)
- **Callbacks:** Early Stopping, ReduceLROnPlateau, Model Checkpointing

---

## 📊 Results & Evaluation  

The model was evaluated on the **test set**, achieving the following performance:  

| Metric         | Score  |
|---------------|--------|
| **MAE**       | **X.XX** |
| **RMSE**      | **X.XX** |
| **R-Squared** | **X.XX** |

### 📌 Forecast Visualization  
The model produces interpretable forecasts with attention scores that highlight important input features over time.

---

## 📌 Future Improvements  

- **📊 Incorporate more external covariates (e.g., weather, holidays).**  
- **📈 Enhance feature engineering with domain-specific knowledge.**  
- **🧠 Implement model ensembling to improve robustness.**  
- **🔍 Fine-tune hyperparameters using Bayesian Optimization.**  

---

## 🤝 Contributors

- **[Lakshit Gupta]**
- **[Athira Ravi Pillai]**
- **[Krish Jain]**
- **[Jinia Goel]**

For any questions, feel free to reach out!

---

## 🏆 Acknowledgments

- Microsoft Hackathon
- Research papers on time-series forecasting


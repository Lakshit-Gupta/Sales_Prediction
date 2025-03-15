# 📈 Temporal Fusion Transformer (TFT) for Sales Prediction

This project implements a **Temporal Fusion Transformer (TFT)** model for sales prediction, inspired by the **Microsoft Hackathon**. The TFT model efficiently captures both short-term and long-term dependencies in time series data while providing **interpretable** insights into feature importance. This makes it highly suitable for forecasting applications in retail, finance, and other industries.

---

## 💻 Run Locally

Clone the project repository:

```bash
git clone https://github.com/YourUsername/TFT_Sales_Prediction.git
```

Navigate to the project directory:

```bash
cd TFT_Sales_Prediction
```

---

## 📥 Dataset and Model Download

The dataset and pretrained model for this project are available in the **[Releases](https://github.com/YourUsername/TFT_Sales_Prediction/releases)** section. Click the link to download the necessary files.

---

## ⚙️ Resolving Dependencies

If using **Anaconda**, install dependencies by running:

```bash
conda env create -f environment.yaml
```
```bash
conda activate tft_env
```

Alternatively, use pip:
```bash
pip install -r requirements.txt
```

---

## 🚀 How to Run the Application

To train and evaluate the TFT model, run the following command:
```bash
python train.py
```

For inference on test data, execute:
```bash
python predict.py
```

---

## 🐳 **Docker Setup**

### CPU Version

```bash
docker pull yourusername/tft_sales_prediction:latest
```
```bash
docker run -p 8501:8501 yourusername/tft_sales_prediction:latest
```
Then open:
```bash
http://localhost:8501
```

### GPU Version

```bash
docker pull yourusername/tft_sales_prediction_gpu:latest
```
```bash
docker run --gpus all -p 8501:8501 yourusername/tft_sales_prediction_gpu:latest
```
Then open:
```bash
http://localhost:8501
```

---

## 📂 Dataset Structure

The dataset consists of sales data across multiple stores and items, formatted as follows:

```
sales_data/
│── train.csv   # Training data
│── val.csv     # Validation data
│── test.csv    # Test data
```

Each row contains:
- `store_nbr`: Store identifier
- `item_nbr`: Item identifier
- `time_idx`: Sequential time index
- `sales`: Target variable
- `other_features`: Additional time-dependent and static features

---

## 🏗️ Model Architecture

The **Temporal Fusion Transformer (TFT)** model consists of:

- **Variable Selection Network (VSN)**: Dynamically selects relevant features.
- **Gated Residual Networks (GRN)**: Handles non-linear transformations.
- **Temporal Self-Attention Layer**: Captures long-term dependencies.
- **Interpretable Attention Mechanisms**: Highlights important features.

### 🔹 Model Summary

```
Input: Multiple categorical and continuous time-series features
Temporal Fusion Transformer (TFT) Model
Fully Connected Layers (For Forecasting)
Output: Multi-step Sales Predictions
```

---

## 🎯 Training & Optimization

- **Optimizer Choices:** AdamW (Recommended), RMSprop
- **Loss Function:** Quantile Loss for probabilistic forecasting
- **Hyperparameter Tuning:** KerasTuner for tuning learning rate, dropout, and model depth
- **Callbacks:** Early Stopping, ReduceLROnPlateau, Model Checkpointing

---

## 📊 Results & Evaluation  

The model was evaluated on the **test set**, achieving the following performance:  

| Metric            | Score  |
|------------------|--------|
| **MAE**         | **1.34** |
| **RMSE**        | **2.17** |
| **Quantile Loss** | **0.92** |

### 📌 Feature Importance (Interpretable Attention)  
The TFT model provides insights into the most influential features, allowing businesses to understand key drivers of sales trends.

---

## 📌 Future Improvements  

- **📈 Extend to multi-horizon forecasting.**  
- **🧠 Enhance interpretability with SHAP analysis.**  
- **⚡ Optimize inference for real-time predictions.**  
- **📊 Explore additional external features (holidays, promotions).**  

---

## 🤝 Contributors

- **[Your Name]**

For any questions, feel free to reach out!

---

## 🏆 Acknowledgments

- **Microsoft Hackathon** for inspiration
- **Research papers on interpretable deep learning models for time series forecasting**


import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { useNavigation } from '@react-navigation/native';
import { forecastApi } from '../api/api'; // Adjust the import path as necessary

const TemplateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const validateExcelData = (data: any[]): boolean => {
    if (!data || data.length !== 37) return false;

    const requiredColumns = ['date', 'history', 'onpromotion', 'is_holiday', 'transactions', 'store_nbr', 'item_nbr'];
    const firstRow = data[0];

    return requiredColumns.every((col) => Object.keys(firstRow).includes(col));
  };

  const uploadFile = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, name } = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!validateExcelData(jsonData)) {
          Alert.alert('Invalid File', 'Excel file must have exactly 37 rows and columns: date, history, onpromotion, is_holiday, transactions, store_nbr, item_nbr.');
          return;
        }

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: name || 'upload.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        } as any);

        const response = await forecastApi.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        Alert.alert('Success', `File uploaded successfully! Rows: ${response.data.row_count}`);
        setModalVisible(false);
        navigation.navigate('ForecastScreen');
      } else {
        Alert.alert('Cancelled', 'No file selected.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload file. Please ensure you are logged in and try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = async () => {
    try {
      const sampleData = Array.from({ length: 37 }, (_, i) => {
        const date = new Date(2023, 0, i + 1);
        return {
          date: date.toISOString().split('T')[0],
          history: i < 30 ? 100 + i * 5 : null,
          onpromotion: i % 2,
          is_holiday: i % 7 === 0 ? 1 : 0,
          transactions: 50 + i * 2,
          store_nbr: 1,
          item_nbr: 1,
        };
      });

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SampleData');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const uri = FileSystem.documentDirectory + 'sample_data.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to download sample file.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A30', '#0B666A']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Data Template</Text>
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>How to Prepare Your Data</Text>
            <Text style={styles.guideText}>
              Upload an Excel file with exactly 37 rows and the following columns:
            </Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Column</Text>
                <Text style={styles.tableHeader}>Description</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>date</Text>
                <Text style={styles.tableCell}>Date in YYYY-MM-DD format (37 days)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>history</Text>
                <Text style={styles.tableCell}>Historical sales (30 days, null for last 7)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>onpromotion</Text>
                <Text style={styles.tableCell}>Items on promotion (0/1, 37 days)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>is_holiday</Text>
                <Text style={styles.tableCell}>Holiday indicator (0/1, 37 days)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>transactions</Text>
                <Text style={styles.tableCell}>Number of transactions (37 days)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>store_nbr</Text>
                <Text style={styles.tableCell}>Store ID (e.g., 1)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>item_nbr</Text>
                <Text style={styles.tableCell}>Item ID (e.g., 1)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadSample}>
              <Feather name="download" size={20} color="#050A30" />
              <Text style={styles.downloadButtonText}>Download Sample</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#050A30', '#0B666A']} style={styles.modalGradient}>
            <Text style={styles.modalTitle}>Upload Your Data</Text>
            <Text style={styles.modalText}>
              Select an Excel file with exactly 37 rows for sales forecasting.
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={uploadFile}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#97FEED" />
              ) : (
                <Text style={styles.uploadButtonText}>Select File</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#97FEED',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: '#97FEED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  guideContainer: {
    width: '100%',
    backgroundColor: '#050A30AA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#97FEED33',
  },
  guideTitle: {
    color: '#97FEED',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  guideText: {
    color: '#97FEED',
    fontSize: 16,
    marginBottom: 15,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#97FEED66',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#97FEED66',
  },
  tableHeader: {
    flex: 1,
    color: '#97FEED',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#0B666A44',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    color: '#97FEED',
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#97FEED',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  downloadButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#97FEED',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalGradient: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#97FEED33',
  },
  modalTitle: {
    color: '#97FEED',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    color: '#97FEED',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#97FEED',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '60%',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#97FEED',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '60%',
  },
  cancelButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TemplateScreen;
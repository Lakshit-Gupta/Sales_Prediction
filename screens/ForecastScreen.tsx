import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define navigation param types
type RootStackParamList = {
  Forecast: undefined;
  Insights: {
    forecast: { p10: number[]; p50: number[]; p90: number[] };
    store_name: string;
    item_name: string;
    history: number[];
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Forecast'>;

const ForecastScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [forecastData, setForecastData] = React.useState<any>(null);
  const [isHoliday, setIsHoliday] = React.useState<boolean[]>(Array(37).fill(false));
  const [onPromotion, setOnPromotion] = React.useState<boolean[]>(Array(37).fill(false));
  const [itemName, setItemName] = React.useState<string>('Item 1');
  const [storeName, setStoreName] = React.useState<string>('Store 1');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [forecastDays, setForecastDays] = React.useState<number>(7);

  const fetchForecast = async (days: number, holiday: boolean[], promo: boolean[]) => {
    setLoading(true);
    try {
      const response = await axios.post('http://10.12.68.234:5000/forecast', {
        forecast_days: days,
        is_holiday: holiday.map(Number),
        onpromotion: promo.map(Number),
        store_name: storeName,
        item_name: itemName,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Forecast response:', response.data);
      setForecastData(response.data);
    } catch (error: any) {
      console.error('Forecast error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : null,
      });
      Alert.alert('Error', `Failed to fetch forecast: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchForecast(forecastDays, isHoliday, onPromotion);
  }, [forecastDays]);

  const handleToggleHoliday = (index: number) => {
    const newHoliday = [...isHoliday];
    newHoliday[index] = !newHoliday[index];
    setIsHoliday(newHoliday);
    fetchForecast(forecastDays, newHoliday, onPromotion);
  };

  const handleTogglePromotion = (index: number) => {
    const newPromo = [...onPromotion];
    newPromo[index] = !newPromo[index];
    setOnPromotion(newPromo);
    fetchForecast(forecastDays, isHoliday, newPromo);
  };

  const goToInsights = () => {
    if (forecastData && forecastData.forecast) {
      navigation.navigate('Insights', {
        forecast: forecastData.forecast,
        store_name: storeName,
        item_name: itemName,
        history: Array(30).fill(100), // Mock history; replace with actual data from app.py if needed
      });
    } else {
      Alert.alert('Error', 'No forecast data available to view insights.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A30', '#0B666A']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Forecast for {itemName} at {storeName}</Text>
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Forecast Data</Text>
            <Text style={styles.guideText}>
              P10: Low estimate (10% chance sales are below this)
            </Text>
            <Text style={styles.guideText}>
              P50: Most likely estimate (median)
            </Text>
            <Text style={styles.guideText}>
              P90: High estimate (10% chance sales are above this)
            </Text>
            {loading ? (
              <Text style={styles.guideText}>Loading forecast...</Text>
            ) : forecastData && forecastData.forecast ? (
              <>
                <View style={styles.table}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableHeader}>Day</Text>
                    <Text style={styles.tableHeader}>P10</Text>
                    <Text style={styles.tableHeader}>P50</Text>
                    <Text style={styles.tableHeader}>P90</Text>
                  </View>
                  {forecastData.forecast.p50.map((value: number, index: number) => (
                    <View style={styles.tableRow} key={index}>
                      <Text style={styles.tableCell}>Day {index + 1}</Text>
                      <Text style={styles.tableCell}>{forecastData.forecast.p10[index].toFixed(2)}</Text>
                      <Text style={styles.tableCell}>{value.toFixed(2)}</Text>
                      <Text style={styles.tableCell}>{forecastData.forecast.p90[index].toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.insightsButton} onPress={goToInsights}>
                  <Text style={styles.insightsButtonText}>View Insights</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.guideText}>No forecast data available.</Text>
            )}
            {forecastData && forecastData.suggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.guideTitle}>Insights</Text>
                {forecastData.suggestions.map((suggestion: any, index: number) => (
                  <Text key={index} style={styles.guideText}>
                    {suggestion.message}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Controls</Text>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Forecast Days:</Text>
              <View style={styles.buttonGroup}>
                {[7, 14, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayButton,
                      forecastDays === days && styles.dayButtonSelected,
                    ]}
                    onPress={() => setForecastDays(days)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      forecastDays === days && styles.dayButtonTextSelected,
                    ]}>
                      {days} Days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Item Name:</Text>
              <TextInput
                style={styles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Enter item name"
                placeholderTextColor="#97FEED66"
              />
            </View>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Store Name:</Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Enter store name"
                placeholderTextColor="#97FEED66"
              />
            </View>
            <Text style={styles.guideText}>Toggle future days (31-37):</Text>
            {Array.from({ length: 7 }, (_, i) => i + 30).map((day) => (
              <View key={day} style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Day {day - 29}:</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Holiday</Text>
                  <Switch
                    value={isHoliday[day]}
                    onValueChange={() => handleToggleHoliday(day)}
                    trackColor={{ false: '#050A30', true: '#97FEED' }}
                    thumbColor={isHoliday[day] ? '#0B666A' : '#97FEED'}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Promotion</Text>
                  <Switch
                    value={onPromotion[day]}
                    onValueChange={() => handleTogglePromotion(day)}
                    trackColor={{ false: '#050A30', true: '#97FEED' }}
                    thumbColor={onPromotion[day] ? '#0B666A' : '#97FEED'}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
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
    marginBottom: 10,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#97FEED66',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
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
  suggestionsContainer: {
    width: '100%',
    marginTop: 20,
  },
  insightsButton: {
    backgroundColor: '#97FEED',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  insightsButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlLabel: {
    color: '#97FEED',
    fontSize: 16,
    width: 120,
  },
  input: {
    flex: 1,
    backgroundColor: '#050A30AA',
    color: '#97FEED',
    borderWidth: 1,
    borderColor: '#97FEED66',
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
  },
  buttonGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    backgroundColor: '#050A30AA',
    borderWidth: 1,
    borderColor: '#97FEED66',
    borderRadius: 5,
    padding: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#97FEED',
    borderColor: '#97FEED',
  },
  dayButtonText: {
    color: '#97FEED',
    fontSize: 14,
  },
  dayButtonTextSelected: {
    color: '#050A30',
    fontWeight: '600',
  },
  toggleContainer: {
    marginBottom: 15,
  },
  toggleLabel: {
    color: '#97FEED',
    fontSize: 16,
    marginBottom: 5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 20,
  },
  switchLabel: {
    color: '#97FEED',
    fontSize: 14,
  },
});

export default ForecastScreen;
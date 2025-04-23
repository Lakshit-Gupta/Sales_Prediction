import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { forecastApi } from '../api/api';

// Navigation types
type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForecastScreen: undefined;
  HomeScreen: undefined;
  InsightsScreen: {
    forecast?: { p10: number[]; p50: number[]; p90: number[] };
    store_name?: string;
    item_name?: string;
    history?: number[];
  };
};

// Prediction type
interface Prediction {
  item_name: string;
  store_name: string;
  forecast: { p10: number[]; p50: number[]; p90: number[] };
  suggestions: { type: string; message: string; confidence: number }[];
  timestamp: string;
  filename: string;
}

// ChartData type for react-native-chart-kit
interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

type InsightsRouteProp = RouteProp<RootStackParamList, 'InsightsScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InsightsScreen'>;

const InsightsScreen: React.FC = () => {
  const route = useRoute<InsightsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [userStoreName, setUserStoreName] = React.useState<string>('Unknown Store');
  const [selectedItemName, setSelectedItemName] = React.useState<string>('Milk 1L');
  const [fallbackForecast, setFallbackForecast] = React.useState<{
    p10: number[];
    p50: number[];
    p90: number[];
  }>({ p10: [], p50: [], p90: [] });
  const [fallbackHistory, setFallbackHistory] = React.useState<number[]>([]);

  React.useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          Alert.alert('Error', 'Not logged in. Please log in to continue.', [
            { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
          ]);
          return;
        }

        // Fetch user data
        const userResponse = await forecastApi.get('/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const storeName = userResponse.data?.store_name || 'Unknown Store';
        setUserStoreName(storeName);

        // Fetch predictions
        const predictionsResponse = await forecastApi.get('/predictions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedPredictions = predictionsResponse.data?.predictions || [];
        setPredictions(fetchedPredictions);
        console.log('Fetched predictions:', fetchedPredictions);

        // If no route params (e.g., from Home Page), use fallback data
        if (!route.params?.forecast || !route.params?.store_name || !route.params?.item_name) {
          if (fetchedPredictions.length > 0) {
            // Select the most recent prediction
            const latestPrediction = fetchedPredictions.reduce((latest: Prediction, current: Prediction) =>
              new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
            );
            setSelectedItemName(latestPrediction.item_name);
            setFallbackForecast(latestPrediction.forecast);
            // Generate synthetic history (e.g., last 30 days with slight variation)
            setFallbackHistory(
              Array(30)
                .fill(0)
                .map((_, i) => latestPrediction.forecast.p50[0] * (0.9 + 0.2 * Math.random()))
            );
          } else {
            // No predictions available, prompt to generate forecast
            Alert.alert(
              'No Predictions',
              'No forecast data available. Please generate a forecast first.',
              [{ text: 'OK', onPress: () => navigation.navigate('ForecastScreen') }]
            );
            setFallbackForecast({ p10: Array(7).fill(0), p50: Array(7).fill(50), p90: Array(7).fill(100) });
            setFallbackHistory(Array(30).fill(20));
          }
        }
      } catch (error: any) {
        console.error('Initialization error:', error?.response?.data);
        Alert.alert('Error', error?.response?.data?.error || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [navigation, route.params]);

  const effectiveStoreName = route.params?.store_name || userStoreName;
  const effectiveItemName = route.params?.item_name || selectedItemName;
  const effectiveForecast = route.params?.forecast || fallbackForecast;
  const effectiveHistory = route.params?.history || fallbackHistory;

  const chartData = {
    p10: effectiveForecast.p10.length ? effectiveForecast.p10 : Array(7).fill(0),
    p50: effectiveForecast.p50.length ? effectiveForecast.p50 : Array(7).fill(50),
    p90: effectiveForecast.p90.length ? effectiveForecast.p90 : Array(7).fill(100),
    history: effectiveHistory.length ? effectiveHistory : Array(30).fill(20),
  };

  const storePredictions = predictions.filter((p) => p.store_name === effectiveStoreName);

  const itemAverages = storePredictions.reduce((acc, pred) => {
    const avgP50 =
      pred.forecast.p50.reduce((sum: number, val: number) => sum + val, 0) / pred.forecast.p50.length;
    acc[pred.item_name] = avgP50;
    return acc;
  }, {} as Record<string, number>);

  const barChartData: ChartData = {
    labels: Object.keys(itemAverages).length ? Object.keys(itemAverages) : ['No Items'],
    datasets: [
      {
        data: Object.keys(itemAverages).length
          ? Object.values(itemAverages).map((value) => Number(value))
          : [0],
      },
    ],
  };

  const generateInsights = () => {
    const insights = [];

    const avgP50 = chartData.p50.reduce((sum, val) => sum + val, 0) / chartData.p50.length;
    insights.push({
      type: 'Stock Adjustment',
      message: `Based on a forecasted average of ${avgP50.toFixed(
        2
      )} units/day for ${effectiveItemName}, adjust stock to cover at least ${Math.ceil(
        avgP50 * 1.2
      )} units to account for demand spikes.`,
    });

    const highP90Days = chartData.p90.filter((val, idx) => val > chartData.p50[idx] * 1.5).length;
    if (highP90Days > 2) {
      insights.push({
        type: 'Promotion Strategy',
        message: `High demand potential detected on ${highP90Days} days for ${effectiveItemName}. Consider running promotions to capitalize on these peaks.`,
      });
    }

    const holidayImpact = chartData.p50.some((val, idx) => val > chartData.history[idx % 30] * 1.3);
    if (holidayImpact) {
      insights.push({
        type: 'Holiday Impact',
        message: `Forecast for ${effectiveItemName} shows elevated sales, likely due to holidays. Ensure extra staff and inventory are available.`,
      });
    }

    const trend = chartData.p50[chartData.p50.length - 1] > chartData.p50[0] ? 'increasing' : 'decreasing';
    insights.push({
      type: 'Sales Trend',
      message: `Sales for ${effectiveItemName} are ${trend} over the forecast period. Plan marketing or inventory adjustments accordingly.`,
    });

    const volatility = Math.max(...chartData.p90) - Math.min(...chartData.p10);
    if (volatility > avgP50 * 2) {
      insights.push({
        type: 'Risk Analysis',
        message: `High volatility in ${effectiveItemName} forecasts (range: ${volatility.toFixed(
        2
      )} units). Maintain flexible stock levels to mitigate risks.`,
      });
    }

    if (Object.keys(itemAverages).length > 1) {
      const topItem = Object.keys(itemAverages).reduce(
        (a, b) => (itemAverages[b] > itemAverages[a] ? b : a),
        Object.keys(itemAverages)[0] || ''
      );
      insights.push({
        type: 'Multi-Item Comparison',
        message: `${topItem} is projected to have the highest demand in ${effectiveStoreName} (avg: ${itemAverages[
          topItem
        ].toFixed(2)} units/day). Prioritize its stock allocation.`,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A30', '#0B666A']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>
            {effectiveStoreName} - {effectiveItemName}
          </Text>
          <Text style={styles.subtitle}>Historical Sales (Past 30 Days)</Text>
          <Text style={styles.chartDescription}>
            Shows daily sales units for {effectiveItemName} over the past 30 days.
          </Text>
          <LineChart
            data={{
              labels: Array.from({ length: chartData.history.length }, (_, i) => `${i + 1}`),
              datasets: [
                {
                  data: chartData.history,
                  color: () => '#FF00FF',
                  strokeWidth: 2,
                },
              ],
            }}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundGradientFrom: '#050A30',
              backgroundGradientTo: '#0B666A',
              decimalPlaces: 0,
              color: () => '#97FEED',
              labelColor: () => '#97FEED',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#97FEED',
              },
            }}
            style={styles.chart}
            yAxisLabel="Units"
            yAxisSuffix=""
            xAxisLabel="Day"
          />
          <Text style={styles.subtitle}>Sales Forecast for {effectiveItemName} (Next 7 Days)</Text>
          <Text style={styles.chartDescription}>
            Shows predicted sales units: p50 (median, magenta), p10/p90 (low/high bounds, green).
          </Text>
          <LineChart
            data={{
              labels: ['1', '2', '3', '4', '5', '6', '7'],
              datasets: [
                {
                  data: chartData.p10,
                  color: () => '#00FF00',
                  strokeWidth: 1,
                },
                {
                  data: chartData.p50,
                  color: () => '#FF00FF',
                  strokeWidth: 2,
                },
                {
                  data: chartData.p90,
                  color: () => '#00FF00',
                  strokeWidth: 1,
                },
              ],
            }}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundGradientFrom: '#050A30',
              backgroundGradientTo: '#0B666A',
              decimalPlaces: 0,
              color: () => '#97FEED',
              labelColor: () => '#97FEED',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#97FEED',
              },
            }}
            style={styles.chart}
            yAxisLabel="Units"
            yAxisSuffix=""
            xAxisLabel="Day"
          />
          <Text style={styles.subtitle}>Average Daily Predictions for {effectiveStoreName}</Text>
          <Text style={styles.chartDescription}>
            Shows average predicted sales units per day for each item in {effectiveStoreName}.
          </Text>
          {loading ? (
            <Text style={styles.guideText}>Loading predictions...</Text>
          ) : Object.keys(itemAverages).length ? (
            <BarChart
              data={barChartData}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#050A30',
                backgroundGradientTo: '#0B666A',
                decimalPlaces: 0,
                color: () => '#97FEED',
                labelColor: () => '#97FEED',
                barPercentage: 0.8, // Increased for wider bars
                barRadius: 4, // Rounded edges
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={styles.chart}
              yAxisLabel="Units"
              yAxisSuffix=""
              xAxisLabel="Item"
            />
          ) : (
            <Text style={styles.guideText}>No predictions available for {effectiveStoreName}.</Text>
          )}
          <Text style={styles.subtitle}>Business Insights</Text>
          <Text style={styles.chartDescription}>
            Actionable recommendations based on forecast data for {effectiveItemName}.
          </Text>
          <View style={styles.insightsContainer}>
            {insights.length ? (
              insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightTitle}>{insight.type}</Text>
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.guideText}>No insights available.</Text>
            )}
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#97FEED',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: '#97FEED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: '#97FEED',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
  },
  chartDescription: {
    color: '#97FEED',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  guideText: {
    color: '#97FEED',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  insightsContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 40,
  },
  insightItem: {
    backgroundColor: '#062743',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  insightTitle: {
    color: '#97FEED',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  insightText: {
    color: '#97FEED',
    fontSize: 14,
  },
});

export default InsightsScreen;
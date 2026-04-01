import Papa from 'papaparse';

export interface StudentData {
  midterm: number;
  attendance: number;
  studyHrs: number;
  sleepHrs: number;
  screenTime: number;
  syllabus: number;
  panic: number;
  finalScore?: number;
  seat?: string;
  prep?: string;
  travelTime?: number;
  ott?: string;
}

export interface PredictionFormData {
  attendance_pct: number;
  study_hrs: number;
  syllabus_understood: number;
  seat_position: number;
  screen_time_hrs: number;
  ott_hrs_per_week: number;
  exam_prep_timing: number;
  travel_time_hrs: number;
  sleep_hrs: number;
  panic_level: number;
  midterm_pct: number;
}

export interface PredictionResult {
  predicted_score: number;
  risk: string;
}

export interface AnalyticsData {
  studyVsScore: { hrs: number; score: number }[];
  scoreDistribution: { score: string; count: number }[];
  classAnalytics: { name: string; value: number; full: number; unit: string }[];
  featureImportance: { name: string; value: number }[];
  screenTimeData: { range: string; score: number }[];
  topScorerHabits: {
    attendance: number;
    screenTime: number;
    sleepHrs: number;
    studyHrs: number;
  };
}

class DataService {
  /**
   * Parses CSV text and returns structured student data.
   */
  async parseLocalCsv(csvText: string): Promise<StudentData[]> {
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedData = results.data.map((row: any) => {
            const entry: any = {};
            Object.keys(row).forEach(key => {
              const lowerKey = key.toLowerCase();
              const val = row[key];
              
              if (lowerKey.includes('midterm')) entry.midterm = val;
              else if (lowerKey.includes('attendance')) entry.attendance = val;
              else if (lowerKey.includes('study')) entry.studyHrs = val;
              else if (lowerKey.includes('sleep')) entry.sleepHrs = val;
              else if (lowerKey.includes('screen')) entry.screenTime = val;
              else if (lowerKey.includes('syllabus')) entry.syllabus = val;
              else if (lowerKey.includes('panic')) entry.panic = val;
              else if (lowerKey.includes('final') || lowerKey.includes('score') || lowerKey.includes('endsem')) entry.finalScore = val;
              else if (lowerKey.includes('seat')) entry.seat = val;
              else if (lowerKey.includes('prep')) entry.prep = val;
            });
            return entry;
          }).filter(d => d.midterm !== undefined);
          resolve(mappedData);
        }
      });
    });
  }

  /**
   * Generates analytics from student data.
   */
  generateAnalytics(data: StudentData[]): AnalyticsData {
    if (data.length === 0) {
      return {
        studyVsScore: [],
        scoreDistribution: [],
        classAnalytics: [],
        featureImportance: [],
        screenTimeData: [],
        topScorerHabits: { attendance: 0, screenTime: 0, sleepHrs: 0, studyHrs: 0 }
      };
    }

    // 1. Study vs Score
    const studyMap = new Map<number, { sum: number; count: number }>();
    data.forEach(d => {
      if (d.studyHrs !== undefined && d.finalScore !== undefined) {
        const hrs = Math.round(d.studyHrs);
        const current = studyMap.get(hrs) || { sum: 0, count: 0 };
        studyMap.set(hrs, { sum: current.sum + d.finalScore, count: current.count + 1 });
      }
    });
    const studyVsScore = Array.from(studyMap.entries())
      .map(([hrs, stats]) => ({ hrs, score: Math.round(stats.sum / stats.count) }))
      .sort((a, b) => a.hrs - b.hrs);

    // 2. Score Distribution
    const scoreMap = new Map<string, number>();
    data.forEach(d => {
      if (d.finalScore !== undefined) {
        const score = Math.round(d.finalScore).toString();
        scoreMap.set(score, (scoreMap.get(score) || 0) + 1);
      }
    });
    const scoreDistribution = Array.from(scoreMap.entries())
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => parseInt(a.score) - parseInt(b.score));

    // 3. Class Analytics
    const avgAttendance = data.reduce((acc, d) => acc + (d.attendance || 0), 0) / data.length;
    const avgScreen = data.reduce((acc, d) => acc + (d.screenTime || 0), 0) / data.length;
    const avgScore = data.reduce((acc, d) => acc + (d.finalScore || 0), 0) / data.length;
    const avgStudy = data.reduce((acc, d) => acc + (d.studyHrs || 0), 0) / data.length;
    
    const classAnalytics = [
      { name: 'Attendance', value: Math.round(avgAttendance * 10) / 10, full: 100, unit: '%' },
      { name: 'Screen Time', value: Math.round(avgScreen * 10) / 10, full: 16, unit: 'hrs' },
      { name: 'Avg Marks', value: Math.round(avgScore * 10) / 10, full: 100, unit: '%' },
      { name: 'Avg Study', value: Math.round(avgStudy * 10) / 10, full: 12, unit: 'hrs' },
    ];

    // 4. Screen Time Data
    const screenRanges = [
      { range: '0-2h', min: 0, max: 2, sum: 0, count: 0 },
      { range: '2-4h', min: 2, max: 4, sum: 0, count: 0 },
      { range: '4-6h', min: 4, max: 6, sum: 0, count: 0 },
      { range: '6-8h', min: 6, max: 8, sum: 0, count: 0 },
      { range: '8h+', min: 8, max: 24, sum: 0, count: 0 },
    ];
    data.forEach(d => {
      if (d.screenTime !== undefined && d.finalScore !== undefined) {
        const range = screenRanges.find(r => d.screenTime >= r.min && d.screenTime < r.max);
        if (range) {
          range.sum += d.finalScore;
          range.count += 1;
        }
      }
    });
    const screenTimeData = screenRanges.map(r => ({
      range: r.range,
      score: r.count > 0 ? Math.round(r.sum / r.count) : 0
    }));

    // 5. Top Scorer Habits
    const sortedData = [...data].filter(d => d.finalScore !== undefined).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    const topScorer = sortedData[0];
    
    const topScorerHabits = {
      attendance: topScorer ? Math.round((topScorer.attendance || 0) * 10) / 10 : 95,
      screenTime: topScorer ? Math.round((topScorer.screenTime || 0) * 10) / 10 : 2,
      sleepHrs: topScorer ? Math.round((topScorer.sleepHrs || 0) * 10) / 10 : 8,
      studyHrs: topScorer ? Math.round((topScorer.studyHrs || 0) * 10) / 10 : 5,
    };

    // 6. Feature Importance (Static for now as it's model-specific)
    const featureImportance = [
      { name: 'Midterm Score', value: 45 },
      { name: 'Attendance', value: 25 },
      { name: 'Study Hours', value: 15 },
      { name: 'Syllabus', value: 8 },
      { name: 'Screen Time', value: 5 },
      { name: 'Sleep Hours', value: 2 },
    ];

    return {
      studyVsScore,
      scoreDistribution,
      classAnalytics,
      featureImportance,
      screenTimeData,
      topScorerHabits
    };
  }

  async getPrediction(formData: PredictionFormData): Promise<PredictionResult> {
    try {
      const response = await fetch('https://lighthouseai-api.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 100));
        throw new Error("Server returned non-JSON response. The ML API might be down or misconfigured.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  }

  async getModelInfo(): Promise<{ mae: number; model_type: string; features_count: number }> {
    try {
      const response = await fetch('https://lighthouseai-api.onrender.com/model-info');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) throw new Error('Failed to fetch model info');
      return await response.json();
    } catch (error) {
      console.error("Model info error:", error);
      return { mae: 4.6, model_type: "Random Forest Regressor", features_count: 11 };
    }
  }
}

export const dataService = new DataService();

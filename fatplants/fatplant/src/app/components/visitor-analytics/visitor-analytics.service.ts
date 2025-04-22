import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface VisitorData {
  total: number;
  monthly: number;
  countries: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class VisitorAnalyticsService {
  private apiUrl = '/analytics';
  private cache: {[key: string]: {data: VisitorData, timestamp: number}} = {};
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) { }

  getVisitorData(timeRange: string): Observable<VisitorData> {
    // Check cache first
    const now = Date.now();
    const cachedData = this.cache[timeRange];
    
    if (cachedData && (now - cachedData.timestamp < this.cacheExpiration)) {
      console.log(`Using cached data for ${timeRange}`);
      return of(cachedData.data);
    }

    // Fetch fresh data from API
    return this.http.get<VisitorData>(`${this.apiUrl}/visitors?range=${timeRange}`)
      .pipe(
        map(data => {
          // Store in cache
          this.cache[timeRange] = {
            data,
            timestamp: now
          };
          return data;
        }),
        catchError(error => {
          console.error(`Error fetching visitor data for ${timeRange}:`, error);
          // Return empty data on error
          const emptyData: VisitorData = {
            total: 0,
            monthly: 0,
            countries: {}
          };
          return of(emptyData);
        }),
        shareReplay(1)
      );
  }

  getVisitorDataByCountry(timeRange: string): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/visitors/countries?range=${timeRange}`)
      .pipe(
        catchError(() => of({})),
        shareReplay(1)
      );
  }

  clearCache() {
    this.cache = {};
  }
} 
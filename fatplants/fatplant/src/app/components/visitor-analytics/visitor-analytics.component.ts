import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VisitorAnalyticsService } from './visitor-analytics.service';
import { VisitorData } from './visitor-analytics.service';

@Component({
  selector: 'app-visitor-analytics',
  templateUrl: './visitor-analytics.component.html',
  styleUrls: ['./visitor-analytics.component.css']
})
export class VisitorAnalyticsComponent implements OnInit, OnDestroy {
  visitorData: VisitorData | null = null;
  loading = false;
  error: string | null = null;
  selectedTimeframe = '30d'; // Default to 30 days
  
  private destroy$ = new Subject<void>();
  
  constructor(private visitorAnalyticsService: VisitorAnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    
    this.visitorAnalyticsService.getVisitorData(this.selectedTimeframe)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.visitorData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading visitor data:', err);
          this.error = 'Failed to load visitor analytics. Please try again later.';
          this.loading = false;
        }
      });
  }

  selectTimeframe(timeframe: string): void {
    if (this.selectedTimeframe === timeframe) {
      return; // Already selected
    }
    
    this.selectedTimeframe = timeframe;
    this.loadData();
  }

  retryLoading(): void {
    this.loadData();
  }

  // Helper method to get countries sorted by visitor count
  getSortedCountries(): Array<{name: string, count: number}> {
    if (!this.visitorData || !this.visitorData.countries) {
      return [];
    }
    
    return Object.entries(this.visitorData.countries)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Helper to calculate the percentage for the country bar visualization
  getCountryPercentage(count: number): number {
    if (!this.visitorData || !this.getSortedCountries().length) {
      return 0;
    }
    
    const maxCount = this.getSortedCountries()[0].count;
    return (count / maxCount) * 100;
  }

  // Helper to get a user-friendly timeframe label
  getTimeframeLabel(): string {
    switch (this.selectedTimeframe) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '3m': return 'Last 3 months';
      case '6m': return 'Last 6 months';
      case '1y': return 'Last year';
      default: return 'Selected period';
    }
  }
} 
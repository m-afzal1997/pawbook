import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | number): string {
    if (!value) return '';
    const m = moment(value);
    const now = moment();
    const diffSeconds = now.diff(m, 'seconds');
    const diffMinutes = now.diff(m, 'minutes');
    const diffHours = now.diff(m, 'hours');
    const diffDays = now.diff(m, 'days');
    const diffWeeks = now.diff(m, 'weeks');

    // Show date if more than 4 weeks ago
    if (diffWeeks >= 4) return m.format('MMM D, YYYY');

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes === 1) return 'a minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours === 1) return 'an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'a day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return 'a week ago';
    return `${diffWeeks} weeks ago`;
  }
}

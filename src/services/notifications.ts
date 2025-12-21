// Push Notification Service for Training Day Reminders

export interface WorkoutNotification {
  day: string;
  mesocycle: number;
  week: number;
  expectedGains: string;
  motivation: string;
}

export class NotificationService {
  private static vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  private static registration: ServiceWorkerRegistration | null = null;

  // Initialize service worker and notifications
  static async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.log('Browser does not support notifications or service workers');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Request notification permission
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  static async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.vapidPublicKey) {
      console.log('Service Worker or VAPID key not available');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Schedule training day notification
  static async scheduleWorkoutNotification(workoutData: WorkoutNotification): Promise<void> {
    if (!this.registration) {
      console.log('Service Worker not available');
      return;
    }

    // For development, show immediate notification
    // In production, this would be scheduled on the server
    const message = this.generateMotivationalMessage(workoutData);

    if (Notification.permission === 'granted') {
      new Notification('🏋️ Time for Your Workout!', {
        body: message,
        icon: '/fitness-icon.svg',
        badge: '/fitness-icon.svg',
        tag: 'workout-reminder',
        requireInteraction: true
      });
    }
  }

  // Generate motivational workout message
  private static generateMotivationalMessage(workout: WorkoutNotification): string {
    const dayNames = {
      push: 'Push Day',
      pull: 'Pull Day',
      legs: 'Legs Day',
      arms: 'Arms Day'
    };

    const motivationalPhrases = [
      "Let's build that FFMI 20 physique!",
      "Every rep gets you closer to your goal!",
      "Transform your body with science-based training!",
      "Consistency builds champions!",
      "Your future self will thank you!"
    ];

    const phrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    const dayName = dayNames[workout.day as keyof typeof dayNames] || workout.day;

    return `${dayName} • M${workout.mesocycle}W${workout.week} • ${workout.expectedGains} • ${phrase}`;
  }

  // Get expected gains for current mesocycle/week
  static getExpectedGainsMessage(mesocycle: number, _week: number, isDeload: boolean): string {
    if (isDeload) {
      return "Recovery week - preparing for next phase";
    }

    const gainsMap: Record<number, string> = {
      1: "+0.8cm arms, +1.2cm chest this mesocycle",
      2: "+1.0cm arms, +1.5cm chest this mesocycle",
      3: "+0.6cm arms, +0.8cm chest this mesocycle",
      4: "+1.2cm arms, +1.8cm chest this mesocycle",
      5: "+0.5cm arms, +0.6cm chest this mesocycle",
      6: "+0.8cm arms, +1.0cm chest this mesocycle"
    };

    return gainsMap[mesocycle] || "Building towards FFMI 20 goal";
  }

  // Schedule weekly notifications (called on app load)
  static async scheduleWeeklyReminders(currentMeso: number, currentWeek: number, currentDay: string): Promise<void> {
    const permissions = await this.initialize();
    if (!permissions) return;

    await this.subscribeToPush();

    // Schedule notifications for workout days (Mon, Wed, Fri)
    const workoutDays = ['push', 'pull', 'legs'];
    const isDeload = currentWeek === 8;

    for (const day of workoutDays) {
      const notification: WorkoutNotification = {
        day,
        mesocycle: currentMeso,
        week: currentWeek,
        expectedGains: this.getExpectedGainsMessage(currentMeso, currentWeek, isDeload),
        motivation: day === currentDay ? "Today's session awaits!" : "Upcoming training session"
      };

      // For demo purposes, schedule immediate notification for current day
      if (day === currentDay && !isDeload) {
        setTimeout(() => {
          this.scheduleWorkoutNotification(notification);
        }, 2000); // Show after 2 seconds
      }
    }
  }

  // Utility function to convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }

  // Check notification permission status
  static getNotificationStatus(): 'granted' | 'denied' | 'default' {
    return Notification.permission;
  }

  // Show permission request prompt
  static async requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}
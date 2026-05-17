import * as SecureStore from 'expo-secure-store';

class FeedbackService {
  async submitFeedback(feedbackData) {
    try {
      const payload = {
        ...feedbackData,
        timestamp: new Date().toISOString(),
      };

      // Store feedback locally (queue for later sync if offline)
      const feedback = await SecureStore.getItemAsync('feedback_queue');
      const queue = feedback ? JSON.parse(feedback) : [];
      queue.push(payload);
      await SecureStore.setItemAsync('feedback_queue', JSON.stringify(queue));

      return { success: true, message: 'Feedback submitted successfully' };
    } catch (e) {
      console.error('Feedback submission error:', e);
      return { success: false, message: 'Failed to submit feedback' };
    }
  }

  async getFeedbackQueue() {
    try {
      const feedback = await SecureStore.getItemAsync('feedback_queue');
      return feedback ? JSON.parse(feedback) : [];
    } catch (e) {
      return [];
    }
  }

  async clearFeedbackQueue() {
    try {
      await SecureStore.setItemAsync('feedback_queue', JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing feedback queue:', e);
    }
  }

  async reportError(error, context = {}) {
    return this.submitFeedback({
      type: 'error_report',
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  async submitRating(rating, comments = '') {
    return this.submitFeedback({
      type: 'rating',
      rating,
      comments,
    });
  }
}

export const feedbackService = new FeedbackService();

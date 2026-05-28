export type ConversationAnalysisResult = {
  status: string;
  purchase_intent: string;
  commercial_stage: string;
  main_objection: string;
  lost_opportunity: boolean;
  recoverable: boolean;
  risk_level: string;
  seller_quality_score: number;
  follow_up_detected: boolean;
  closing_attempt_detected: boolean;
  first_response_time_minutes: number;
  summary: string;
  recommended_action: string;
  detected_products: string[];
  customer_sentiment: string;
};

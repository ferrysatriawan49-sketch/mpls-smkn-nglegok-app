export type StudentProgress = 'not_started' | 'in_progress' | 'completed';

export interface Student {
  id: string; // Same as NIS
  nis: string;
  name: string;
  progress: StudentProgress;
  progressPercent: number;
  answers: Record<string, any>;
  lastUpdated?: string;
}

export type QuestionType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'rating'
  | 'file'
  | 'location';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  validationRegex?: string;
  validationMessage?: string;
  dependsOn?: {
    questionId: string;
    value: any;
    condition: 'equals' | 'not_equals' | 'includes';
  };
  placeholder?: string;
  hasOther?: boolean; // For options with "Lainnya: ..."
  maxSelections?: number; // For checkboxes / multiselect
}

export interface QuestionGroup {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: Question[];
}

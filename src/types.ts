export interface SubmissionMeta {
  user_id: string;
  file_id: string;
  status: 'created' | 'uploaded';
  create_time: number;
  last_update_time: number;
}

// Database types
export interface Profile {
  id: string;
  full_name: string;
  birth_place: string | null;
  birth_date: string | null;
  school: string | null;
  grade: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  file_url: string;
  duration: number | null;
  created_at: string;
}

export interface Material {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

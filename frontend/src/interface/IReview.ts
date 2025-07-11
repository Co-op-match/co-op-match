export interface ReviewInterface {
    ID?: number;
    Score?: number;
    description?: string; 
    imag?: any;
    datetime?: string;
    UserID?: number; 
    User?: {
        first_name: string; 
    };
    LikeCount?: number; 
  }
  
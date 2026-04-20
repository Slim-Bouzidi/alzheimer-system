export interface Article {
    id?: number;
    title: string;
    content: string;
    category: string;
    createdAt?: string;
    targetAudience: 'ALL' | 'SOIGNANT' | 'AIDANT';
}

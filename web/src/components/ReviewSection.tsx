'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Review {
    id: number;
    userId: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        name: string;
    };
}

interface ReviewSectionProps {
    type: 'HOTEL' | 'TOUR' | 'FLIGHT';
    itemId: number;
}

export default function ReviewSection({ type, itemId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        fetchReviews();
    }, [type, itemId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}`}/api/reviews/${type}/${itemId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) {
            alert('Vui lòng đăng nhập để gửi nhận xét!');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: (session.user as any).id,
                    type,
                    itemId,
                    rating,
                    comment
                })
            });

            if (res.ok) {
                const newReview = await res.json();
                setReviews([newReview, ...reviews]);
                setComment('');
                setRating(5);
            } else {
                const errorData = await res.json();
                alert(`Lỗi: ${errorData.error}${errorData.details ? `\nChi tiết: ${errorData.details}` : ''}\n\n${errorData.code === 'P2003' ? 'Có vẻ như tài khoản của bạn không còn tồn tại trong hệ thống. Vui lòng đăng xuất và đăng nhập lại!' : ''}`);
            }
        } catch (error) {
            console.error('Submit review error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Đánh giá & Bình luận</h2>

            {/* Review Form */}
            {session?.user ? (
                <form onSubmit={handleSubmit} className="mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="font-semibold mb-4">Viết đánh giá của bạn</h3>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star className="w-6 h-6 fill-current" />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        className="w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px]"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi nhận xét'}
                    </button>
                </form>
            ) : (
                <div className="mb-12 p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <p className="text-blue-800 mb-2">Bạn cần đăng nhập để viết đánh giá</p>
                    <a href="/auth/signin" className="text-blue-600 font-semibold hover:underline">Đăng nhập ngay</a>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-8">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Đang tải đánh giá...</div>
                ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                                        {review.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">{review.user?.name || 'Người dùng'}</div>
                                        <div className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 mt-3 leading-relaxed">{review.comment}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</div>
                )}
            </div>
        </div>
    );
}

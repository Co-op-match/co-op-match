import React, { useEffect, useRef, useState } from "react";
import {
  FaStar,
  FaTh,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
  FaHeart,
} from "react-icons/fa";
import "./StudentReviews.css";
import { GetLikedReviews, GetRwviewCompanyByUserId, LikeReview, UnlikeReview } from "../../../services/https";
import { Avatar, message, Rate } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(relativeTime);
dayjs.locale("th");

interface Review {
  id: number;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  position: string;
  tags: string[];
  helpful: number;
  image_url: string;
}
interface CompanyReviewsProps {
  user_id: number;
}
// 👇 Dummy reviews
// const allReviews: Review[] = [
//   {
//     id: 1,
//     name: "สมชาย ใจดี",
//     rating: 1,
//     date: "2 วันที่แล้ว",
//     text: "ได้เรียนรู้เยอะมากและบรรยากาศดีสุด ๆ!",
//     position: "นักพัฒนาเว็บไซต์",
//   },
//   {
//     id: 2,
//     name: "สมหญิง สู้ชีวิต",
//     rating: 4,
//     date: "3 วันที่แล้ว",
//     text: "เพื่อนร่วมงานน่ารัก แต่บางช่วงงานเยอะไปหน่อย",
//     position: "นักพัฒนาเว็บไซต์",
//   },
//   {
//     id: 3,
//     name: "สายลม เย็นสบาย",
//     rating: 5,
//     date: "5 วันที่แล้ว",
//     text: "เป็นประสบการณ์ฝึกงานที่ดีที่สุดที่เคยมี",
//     position: "นักพัฒนาเว็บไซต์",
//   },
//   {
//     id: 4,
//     name: "นิรนาม นักรีวิว",
//     rating: 4,
//     date: "1 สัปดาห์ที่แล้ว",
//     text: "เทคโนโลยีใหม่เยอะ แนะนำมาก ๆ",
//     position: "Mobile Dev",
//   },
//   {
//     id: 5,
//     name: "สุดหล่อ น่ารัก",
//     rating: 5,
//     date: "1 สัปดาห์ที่แล้ว",
//     text: "พี่ ๆ ใจดี ออฟฟิศสวยมากครับ",
//     position: "UI/UX",
//   },
// ];

const CompanyReviews: React.FC<CompanyReviewsProps> = ({ user_id }) => {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviewsPerSlide, setReviewsPerSlide] = useState(3);
  const [totalSlides, setTotalSlides] = useState(1);
const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);
const [averageRating, setAverageRating] = useState(0);
const [ratingCounts, setRatingCounts] = useState<number[]>([0, 0, 0, 0, 0]);
const [likedReviews, setLikedReviews] = useState<number[]>([]);

  

const startAutoPlay = () => {
  if (autoPlayInterval.current) return; // ถ้ามีอยู่แล้ว ไม่ต้องสร้างใหม่
  autoPlayInterval.current = setInterval(() => {
    setCurrentSlide((prev) =>
      prev >= totalSlides - 1 ? 0 : prev + 1
    );
  }, 5000);
};

const stopAutoPlay = () => {
  if (autoPlayInterval.current) {
    clearInterval(autoPlayInterval.current);
    autoPlayInterval.current = null;
  }
};



  const calculateReviewsPerSlide = () => {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1200) return 2;
    return 3;
  };

useEffect(() => {
  if (!user_id) return;

GetRwviewCompanyByUserId(user_id).then((response) => {
  const reviews: Review[] = response.data || [];
  setAllReviews(reviews);
  filterReviews("all", reviews);

  if (reviews.length > 0) {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 5 stars, 4 stars, ..., 1 star
    let totalRating = 0;

    reviews.forEach((r) => {
      totalRating += r.rating;
      const index = 5 - r.rating; // rating 5 -> index 0, 1 -> index 4
      counts[index]++;
    });

    setAverageRating(totalRating / reviews.length);
    console.log("Avg",totalRating / reviews.length)
    setRatingCounts(counts);
  } else {
    setAverageRating(0);
    setRatingCounts([0, 0, 0, 0, 0]);
  }
});
}, [user_id]);


useEffect(() => {
  if (filteredReviews.length > reviewsPerSlide) {
    startAutoPlay();
  }
  return () => {
    stopAutoPlay();
  };
}, [filteredReviews, reviewsPerSlide]);

const filterReviews = (filter: string, data?: Review[]) => {
  const source = data ?? allReviews;
  setCurrentFilter(filter);
  setCurrentSlide(0);
  let reviews = [...source];
  switch (filter) {
    case "5":
    case "4":
    case "3":
    case "2":
    case "1":
      reviews = reviews.filter((r) => r.rating === Number(filter));
      break;
    case "recent":
      reviews = [...reviews].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 10);
      break;
    default:
      reviews = source;
  }
  const count = calculateReviewsPerSlide();
  setReviewsPerSlide(count);
  setFilteredReviews(reviews);
  setTotalSlides(Math.ceil(reviews.length / count));
};
useEffect(() => {
  const handleResize = () => {
    const count = calculateReviewsPerSlide();
    setReviewsPerSlide(count);
    setTotalSlides(Math.ceil(filteredReviews.length / count));
    setCurrentSlide(0);
  };

  const count = calculateReviewsPerSlide();
  setReviewsPerSlide(count);

  setTimeout(() => {
    if (filteredReviews.length > count) startAutoPlay();
  }, 1000);

  window.addEventListener("resize", handleResize);
  return () => {
    window.removeEventListener("resize", handleResize);
    stopAutoPlay();
  };
}, [filteredReviews]);

useEffect(() => {
  const fetchLiked = async () => {
    const userId = parseInt(localStorage.getItem("id") || "0");
    const res = await GetLikedReviews(userId);
    console.log(res)
    if (res?.status === 200) {
      const ids = (res.data || []).map((id: any) => Number(id)); 
      setLikedReviews(ids);
    }
  };
  fetchLiked();
}, []);


useEffect(() => {
  const wrapper = document.querySelector(".reviews-carousel-wrapper");
  if (!wrapper) return;

  const onEnter = () => stopAutoPlay();
  const onLeave = () => {
    if (filteredReviews.length > reviewsPerSlide) startAutoPlay();
  };

  wrapper.addEventListener("mouseenter", onEnter);
  wrapper.addEventListener("mouseleave", onLeave);

  return () => {
    wrapper.removeEventListener("mouseenter", onEnter);
    wrapper.removeEventListener("mouseleave", onLeave);
  };
}, [filteredReviews, reviewsPerSlide]);

const handleLike = async (reviewId: number) => {
  const userId = parseInt(localStorage.getItem("id") || "0");

  if (likedReviews.includes(reviewId)) {
    // 👎 Unlike
    const res = await UnlikeReview({ user_id: userId, review_id: reviewId });

    if (res?.status === 200) {
      setAllReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpful: r.helpful - 1 } : r
        )
      );
      setFilteredReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpful: r.helpful - 1 } : r
        )
      );
      setLikedReviews(prev => prev.filter(id => id !== reviewId));
      message.info("คุณได้ยกเลิกไลค์รีวิวนี้แล้ว");
    } else {
      message.error("ไม่สามารถยกเลิกไลค์ได้");
    }
  } else {
    // 👍 Like
    const res = await LikeReview({ user_id: userId, review_id: reviewId });

    if (res?.status === 200) {
      setAllReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
        )
      );
      setFilteredReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
        )
      );
      setLikedReviews(prev => [...prev, reviewId]);
      message.success("ขอบคุณที่กดไลค์รีวิว");
    } else if (res?.data?.error) {
      message.warning(res.data.error);
    } else {
      message.error("เกิดข้อผิดพลาด");
    }
  }
};

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(Math.max(0, Math.min(slideIndex, totalSlides - 1)));
  };

const starsDisplay = (rating: number) =>
  Array(5)
    .fill(0)
    .map((_, i) => (
      <FaStar
        key={i}
        className={`star-icon ${i < rating ? "filled" : "empty"}`}
      />
    ));

  const slideWidth = 350 + 20; // 350px card + 20px gap
  const translateX = -currentSlide * (slideWidth * reviewsPerSlide);
    const roundToHalf = (value: number): number => {
    return Math.round(value * 2) / 2;
    };
return (
  <div className="reviews-section">
    {/* ===== SECTION HEADER ===== */}
    <h2 className="section-title">
      <FaStar color="#ffd700" /> รีวิวจากนักศึกษา
    </h2>

    {/* ===== REVIEWS OVERVIEW ===== */}
    <div className="reviews-overview">
      {/* Rating Summary Card */}
      <div className="rating-summary">
        <div className="avg-rating">
          {averageRating.toFixed(2)}
        </div>
        <div className="stars">
          <Rate 
            allowHalf 
            disabled 
            value={roundToHalf(averageRating)} 
          />
        </div>
        <div className="rating-count">
          {allReviews.length} รีวิว
        </div>
      </div>

      {/* Rating Breakdown Card */}
      <div className="rating-breakdown">
        {[5, 4, 3, 2, 1].map((star) => {
          const total = allReviews.length;
          const count = ratingCounts[5 - star]; // 5 → 0, 1 → 4
          const percent = total > 0 ? (count / total) * 100 : 0;

          return (
            <div className="rating-bar" key={star}>
              <div className="star-label">
                <span>{star}</span>
                <FaStar color="#ffd700" />
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${percent}%` }} 
                />
              </div>
              <div className="count">
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* ===== REVIEW FILTERS ===== */}
    <div className="review-filters">
      {[
        { 
          key: "all", 
          label: `ทั้งหมด (${allReviews.length})`, 
          icon: <FaTh /> 
        },
        { 
          key: "5", 
          label: "5 ดาว", 
          icon: <FaStar /> 
        },
        { 
          key: "4", 
          label: "4 ดาว", 
          icon: <FaStar /> 
        },
        { 
          key: "3", 
          label: "3 ดาว", 
          icon: <FaStar /> 
        },
        { 
          key: "2", 
          label: "2 ดาว", 
          icon: <FaStar /> 
        },
        { 
          key: "1", 
          label: "1 ดาว", 
          icon: <FaStar /> 
        },
        { 
          key: "recent", 
          label: "ล่าสุด", 
          icon: <FaClock /> 
        },
      ].map((btn) => (
        <button
          key={btn.key}
          className={`filter-btn ${
            currentFilter === btn.key ? "active" : ""
          }`}
          onClick={() => filterReviews(btn.key)}
        >
          {btn.icon} {btn.label}
        </button>
      ))}
    </div>

    {/* ===== REVIEWS CAROUSEL ===== */}
    <div className="reviews-carousel-wrapper">
      {/* Previous Button */}
      <button
        className="carousel-btn prev"
        onClick={() => goToSlide(currentSlide - 1)}
        disabled={currentSlide === 0}
      >
        <FaChevronLeft />
      </button>

      {/* Carousel Content */}
      <div 
        className="reviews-carousel" 
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {filteredReviews.map((review, idx) => (
          <div
            key={review.id}
            className="review-card fade-in"
            style={{ animationDelay: `${(idx % reviewsPerSlide) * 0.1}s` }}
          >
             <div className="review-content">
            {/* Review Header */}
            <div className="review-header">
              <div>
                <div className="reviewer-name">
                  <Avatar
                    src={review.image_url 
                      ? `http://localhost:8000${review.image_url}` 
                      : undefined
                    }
                    size={35}
                    icon={!review.image_url ? <FaUserCircle /> : undefined}
                  />
                  {review.reviewer}
                </div>
                <div style={{ 
                  fontSize: "0.8rem", 
                  color: "#888", 
                  marginTop: "2px" 
                }}>
                  ตำแหน่ง: {review.position}
                </div>
              </div>
              <div className="review-date">
                {dayjs(review.date).fromNow()}
              </div>
            </div>

            {/* Review Rating */}
            <div className="review-rating">
              {starsDisplay(review.rating)}
            </div>

            {/* Review Text */}
            <div className="review-text">
              {review.comment}
            </div>

            {/* Review Tags */}
            {review.tags && review.tags.length > 0 && (
              <div className="review-tags">
                {review.tags.map((tag, i) => (
                  <span key={i} className="review-tag">
                    #{tag}
                  </span>
                ))}
              </div>   
            )}
              </div>

            {/* Review Footer */}
        <div className="review-footer">
            <button
              className={`like-button ${likedReviews.includes(review.id) ? "liked" : ""}`}
              onClick={() => handleLike(review.id)}
              data-count={review.helpful}
            >
              <FaHeart />
            </button>
            </div>
          </div>
        ))}
      </div>

      {/* Next Button */}
      <button
        className="carousel-btn next"
        onClick={() => goToSlide(currentSlide + 1)}
        disabled={currentSlide >= totalSlides - 1}
      >
        <FaChevronRight />
      </button>
    </div>

    {/* ===== CAROUSEL INDICATORS ===== */}
    <div className="carousel-indicators">
      {Array.from({ length: totalSlides }).map((_, i) => (
        <div
          key={i}
          className={`indicator-dot ${
            currentSlide === i ? "active" : ""
          }`}
          onClick={() => goToSlide(i)}
        />
      ))}
    </div>

    {/* ===== REVIEW COUNTER ===== */}
    <div className="review-counter-horizontal">
      {filteredReviews.length > 0 ? (
        <>
          {currentSlide * reviewsPerSlide + 1} -{" "}
          {Math.min(
            (currentSlide + 1) * reviewsPerSlide,
            filteredReviews.length
          )}{" "}
          จาก {filteredReviews.length} รีวิว
        </>
      ) : (
        <>ไม่มีรีวิวในหมวดนี้</>
      )}
    </div>
  </div>
);
};

export default CompanyReviews;

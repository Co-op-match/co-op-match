const EnhancedRatingDisplay = ({ averageRating, totalReviews, ratingCounts, onFilterChange }) => {
  const [selectedFilter, setSelectedFilter] = useState(null);

  const handleStarClick = (starValue) => {
    const newFilter = selectedFilter === starValue ? null : starValue;
    setSelectedFilter(newFilter);
    
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '16px', 
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafe 100%)',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      border: '1px solid rgba(24, 144, 255, 0.08)'
    }}>
      <Row gutter={[16, 16]} align="middle">
        <Col span={8}>
          <div style={{ 
            textAlign: 'center',
            padding: '12px',
            background: selectedFilter ? 'rgba(24, 144, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700',
              background: selectedFilter ? 
                'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                'linear-gradient(135deg, #faad14 0%, #ff9800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '6px'
            }}>
              {selectedFilter ? selectedFilter.toFixed(1) : averageRating.toFixed(1)}
            </div>
            <Rate disabled value={selectedFilter || averageRating} allowHalf style={{ fontSize: '16px', marginBottom: '6px' }} />
            <div style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>
              {selectedFilter ? 
                `${ratingCounts[5-selectedFilter]} รีวิว ${selectedFilter} ดาว` :
                `จาก ${totalReviews.toLocaleString()} รีวิว`
              }
            </div>
          </div>
        </Col>
        
        <Col span={16}>
          {[5, 4, 3, 2, 1].map((star, index) => {
            const isSelected = selectedFilter === star;
            return (
              <div 
                key={star}
                onClick={() => handleStarClick(star)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '8px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                  border: isSelected ? '1px solid rgba(24, 144, 255, 0.2)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ width: '55px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '600' }}>
                  <span>{star}</span>
                  <StarFilled style={{ color: isSelected ? '#1890ff' : '#faad14', marginLeft: '5px', fontSize: '14px' }} />
                </div>
                <Progress
                  percent={totalReviews > 0 ? (ratingCounts[index] / totalReviews) * 100 : 0}
                  showInfo={false}
                  strokeColor={isSelected ? { '0%': '#1890ff', '100%': '#40a9ff' } : { '0%': '#faad14', '100%': '#ffd666' }}
                  strokeWidth={8}
                  style={{ flex: 1, marginLeft: '10px', marginRight: '10px' }}
                />
                <div style={{ minWidth: '35px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: isSelected ? '#1890ff' : '#333' }}>
                  {ratingCounts[index]}
                </div>
              </div>
            );
          })}
        </Col>
      </Row>
    </div>
  );
};
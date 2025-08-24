// API 설정
const API_CONFIG = {
    endpoint: 'https://apis.data.go.kr/6480000/gnPublicMlfltSttusDataService',
    apiKey: '82ecf3750fed4d1160fc3ee0372198df7e6d8f391934374d063b30143c6e7a3f',
    dataFormat: 'json'
};

// 경상남도 주요 시의 격자 좌표 정의
const CITY_COORDINATES = {
    '창원시': { nx: 89, ny: 76 },
    '진주시': { nx: 81, ny: 75 },
    '통영시': { nx: 87, ny: 68 },
    '사천시': { nx: 80, ny: 71 },
    '김해시': { nx: 95, ny: 77 },
    '밀양시': { nx: 92, ny: 83 },
    '거제시': { nx: 84, ny: 69 },
    '양산시': { nx: 97, ny: 79 },
    '의령군': { nx: 83, ny: 78 },
    '함안군': { nx: 86, ny: 75 },
    '창녕군': { nx: 87, ny: 83 },
    '고성군': { nx: 85, ny: 69 },
    '남해군': { nx: 77, ny: 68 },
    '하동군': { nx: 74, ny: 72 },
    '산청군': { nx: 76, ny: 74 },
    '함양군': { nx: 68, ny: 78 },
    '거창군': { nx: 77, ny: 86 },
    '합천군': { nx: 81, ny: 84 }
};

// DOM 요소들
const citySelect = document.getElementById('citySelect');
const searchBtn = document.getElementById('searchBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const resultsTitle = document.getElementById('resultsTitle');
const hospitalCount = document.getElementById('hospitalCount');
const hospitalGrid = document.getElementById('hospitalGrid');
const errorText = document.getElementById('errorText');

// 현재 선택된 도시
let selectedCity = '';

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    citySelect.addEventListener('change', handleCityChange);
    searchBtn.addEventListener('click', handleSearch);
});

// 도시 선택 변경 핸들러
function handleCityChange() {
    selectedCity = citySelect.value;
    searchBtn.disabled = !selectedCity;
}

// 검색 핸들러
async function handleSearch() {
    if (!selectedCity) return;
    
    showLoading();
    hideResults();
    hideError();
    
    try {
        const hospitals = await fetchHospitalData(selectedCity);
        displayHospitals(hospitals, selectedCity);
    } catch (error) {
        console.error('병원 데이터 조회 중 오류:', error);
        showError('병원 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// API에서 병원 데이터 가져오기
async function fetchHospitalData(city) {
    const coordinates = CITY_COORDINATES[city];
    if (!coordinates) {
        throw new Error('해당 도시의 좌표 정보를 찾을 수 없습니다.');
    }
    
    const params = new URLSearchParams({
        serviceKey: API_CONFIG.apiKey,
        pageNo: '1',
        numOfRows: '100',
        dataType: API_CONFIG.dataFormat,
        nx: coordinates.nx.toString(),
        ny: coordinates.ny.toString()
    });
    
    const url = `${API_CONFIG.endpoint}/getGnPublicMlfltSttusData?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return parseHospitalData(data);
}

// API 응답 데이터 파싱
function parseHospitalData(apiResponse) {
    try {
        const items = apiResponse.response?.body?.items?.item;
        if (!items) {
            return [];
        }
        
        // 단일 항목인 경우 배열로 변환
        const hospitalArray = Array.isArray(items) ? items : [items];
        
        return hospitalArray.map(item => ({
            name: item.yadmNm || '병원명 없음',
            address: item.addr || '주소 정보 없음',
            phone: item.telno || '전화번호 없음',
            department: item.clCdNm || '진료과 정보 없음',
            operatingHours: item.hospUrl || '운영시간 정보 없음',
            rating: generateRandomRating(), // API에 평점 정보가 없으므로 랜덤 생성
            type: item.ykiho || '기관정보 없음'
        }));
    } catch (error) {
        console.error('데이터 파싱 오류:', error);
        return [];
    }
}

// 랜덤 평점 생성 (API에 평점 정보가 없는 경우)
function generateRandomRating() {
    const ratings = [3.5, 4.0, 4.2, 4.5, 4.7, 4.8, 4.9];
    return ratings[Math.floor(Math.random() * ratings.length)];
}

// 병원 정보 표시
function displayHospitals(hospitals, city) {
    hideLoading();
    
    if (hospitals.length === 0) {
        showError(`${city}의 병원 정보를 찾을 수 없습니다.`);
        return;
    }
    
    resultsTitle.textContent = `${city} 병원 정보`;
    hospitalCount.textContent = hospitals.length;
    
    hospitalGrid.innerHTML = '';
    
    hospitals.forEach(hospital => {
        const hospitalCard = createHospitalCard(hospital);
        hospitalGrid.appendChild(hospitalCard);
    });
    
    showResults();
}

// 병원 카드 생성
function createHospitalCard(hospital) {
    const card = document.createElement('div');
    card.className = 'hospital-card';
    
    const stars = generateStarRating(hospital.rating);
    
    card.innerHTML = `
        <div class="hospital-name">
            <i class="fas fa-hospital"></i>
            ${hospital.name}
        </div>
        <div class="hospital-info">
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span class="info-label">주소:</span>
                <span class="info-value">${hospital.address}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-phone"></i>
                <span class="info-label">전화:</span>
                <span class="info-value">${hospital.phone}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-stethoscope"></i>
                <span class="info-label">진료과:</span>
                <span class="info-value">${hospital.department}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-clock"></i>
                <span class="info-label">운영시간:</span>
                <span class="info-value">${hospital.operatingHours}</span>
            </div>
        </div>
        <div class="hospital-rating">
            <div class="rating-stars">
                ${stars}
            </div>
            <span class="rating-text">${hospital.rating} / 5.0</span>
        </div>
    `;
    
    return card;
}

// 별점 생성
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // 완전한 별
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // 반별
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 빈 별
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// UI 상태 관리 함수들
function showLoading() {
    loadingSection.style.display = 'block';
}

function hideLoading() {
    loadingSection.style.display = 'none';
}

function showResults() {
    resultsSection.style.display = 'block';
}

function hideResults() {
    resultsSection.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorSection.style.display = 'block';
    hideLoading();
}

function hideError() {
    errorSection.style.display = 'none';
}

// 재시도 함수
function retrySearch() {
    if (selectedCity) {
        handleSearch();
    }
}

// 페이지 로드 시 초기 상태 설정
window.addEventListener('load', function() {
    searchBtn.disabled = true;
});

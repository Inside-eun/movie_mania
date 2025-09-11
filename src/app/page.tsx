'use client';

import { useState } from 'react';

interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string;
  director?: string;
  source?: string;
}

interface CrawlResponse {
  success: boolean;
  count: number;
  data: MovieSchedule[];
  timestamp: string;
  error?: string;
}

const CRAWL_TYPES = [
  { value: 'integrated', label: '통합 (예술영화관 + 한국영상자료원)' },
  { value: 'art', label: '예술영화관만' },
  { value: 'kofa', label: '한국영상자료원만' }
];

export default function Home() {
  const [allMovies, setAllMovies] = useState<MovieSchedule[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<MovieSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawlType, setCrawlType] = useState('integrated');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/crawl?type=${crawlType}&date=${selectedDate}`);
      const data: CrawlResponse = await response.json();
      
      if (data.success) {
        setAllMovies(data.data);
        setFilteredMovies(data.data);
        setSelectedMovie('all'); // 새로 크롤링하면 필터 초기화
        setLastUpdate(new Date(data.timestamp).toLocaleString('ko-KR'));
      } else {
        setError(data.error || '크롤링 실패');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 고유한 영화 목록 가져오기
  const getUniqueMovies = () => {
    const uniqueTitles = [...new Set(allMovies.map(movie => movie.title))];
    return uniqueTitles.sort();
  };

  // 영화 필터링
  const handleMovieFilter = (movieTitle: string) => {
    setSelectedMovie(movieTitle);
    if (movieTitle === 'all') {
      setFilteredMovies(allMovies);
    } else {
      setFilteredMovies(allMovies.filter(movie => movie.title === movieTitle));
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-center">홍대병들을 위한 서울 예술영화관 상영시간표</h1>
      <h2 className="text-xl font-bold mb-2 text-center">박스오피스 5위까지의 작품은 제외합니다</h2>

      <p className="text-sm text-gray-500 text-center">kobis에서 제공되는 스케쥴을 하나하나 조회하는 방식이라 초기 로딩시간이 꽤 걸립니다 </p>
      <p className="text-sm text-gray-500 mb-8 text-center">대략적인 스케쥴의 감을 잡을때만 사용해주세요</p>
      
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="date"
            className="px-4 py-2 border rounded-lg h-10"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 7일 후까지
          />

          
          <button
            onClick={fetchMovies}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed h-10 flex items-center justify-center whitespace-nowrap"
          >
            {loading ? '크롤링 중... ' : '상영시간표 조회'}
          </button>
          
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              마지막 업데이트: {lastUpdate}
            </span>
          )}
        </div>

        {allMovies.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">영화별 필터:</label>
            <select 
              className="px-4 py-2 border rounded-lg h-10 flex-1 sm:flex-none sm:min-w-[300px]"
              value={selectedMovie}
              onChange={(e) => handleMovieFilter(e.target.value)}
            >
              <option value="all">전체 영화 ({allMovies.length}개 상영시간)</option>
              {getUniqueMovies().map(movieTitle => {
                const count = allMovies.filter(m => m.title === movieTitle).length;
                return (
                  <option key={movieTitle} value={movieTitle}>
                    {movieTitle} ({count}개 상영시간)
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">상영시간표를 불러오는 중...</p>
          <p className="mt-2 text-gray-600">최대 1분정도 걸릴 수 있습니다</p>
        </div>
      )}

      {!loading && filteredMovies.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })} - 총 {filteredMovies.length}개의 상영 스케줄
            {selectedMovie !== 'all' && (
              <span className="ml-2 text-blue-600 font-medium">
                (&apos;{selectedMovie}&apos; 필터 적용)
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMovies.map((movie, index) => (
              <div key={index} className="p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start mb-2">
                  <time className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                    {movie.time}
                  </time>
                  {movie.source && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {movie.source}
                    </span>
                  )}
                </div>
                
                <h2 className="text-base font-semibold mb-2 line-clamp-2">{movie.title}</h2>
                
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span className="font-medium truncate">{movie.theater}</span>
                  {movie.area && <span className="text-gray-500 ml-2 flex-shrink-0">{movie.area}</span>}
                </div>
                
                {movie.screen && (
                  <p className="text-gray-500 text-xs mb-1">{movie.screen}</p>
                )}
                {movie.director && (
                  <p className="text-gray-500 text-xs">감독: {movie.director}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && allMovies.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          상영시간표 조회 버튼을 클릭해주세요.
        </div>
      )}

      {!loading && allMovies.length > 0 && filteredMovies.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          선택한 영화의 상영시간이 없습니다.
        </div>
      )}
    </main>
  );
}
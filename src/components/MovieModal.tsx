"use client";

import { useEffect, useState } from "react";
import { getMovieInfoFromKOBIS } from "../services/kobisApi";

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    title: string;
    theater: string;
    area: string;
    screen: string;
    time: string;
    movieCode?: string;
    director?: string;
    posterUrl?: string;
    prodYear?: string;
    runtime?: string;
    source?: string;
  } | null;
}

interface KOBISMovieInfo {
  movieCd?: string;
  movieNm?: string;
  movieNmEn?: string;
  movieNmOg?: string;
  prdtYear?: string;
  openDt?: string;
  showTm?: string;
  genres?: Array<{ genreNm: string }>;
  directors?: Array<{ peopleNm: string }>;
  actors?: Array<{ peopleNm: string; cast?: string }>;
  audits?: Array<{ auditNo: string; watchGradeNm: string }>;
}

interface KMDBApiData {
  cActors?: string;
  cCodeSubName2?: string;
}


export default function MovieModal({ isOpen, onClose, movie }: MovieModalProps) {
  const [kobisData, setKobisData] = useState<KOBISMovieInfo | null>(null);
  const [kmdbData, setKmdbData] = useState<KMDBApiData | null>(null);
  const [loading, setLoading] = useState(false);

  // 영화가 변경될 때 API 호출
  useEffect(() => {
    if (isOpen && movie && movie.movieCode) {
      setLoading(true);
      
      // 즉시 기본 정보 표시를 위해 로딩 상태를 짧게 유지
      const loadingTimer = setTimeout(() => {
        setLoading(false);
      }, 1000); // 최대 1초 로딩
      
      // 새로운 API 라우트를 통해 영화 정보 가져오기
      const fetchMovieInfo = async () => {
        try {
          const response = await fetch(
            `/api/movie-info?movieCode=${movie.movieCode}&source=${movie.source || 'KOBIS'}`
          );
          const result = await response.json();
          
          if (result.success && result.data) {
            if (movie.source === 'KMDB_API') {
              setKmdbData(result.data);
            } else {
              setKobisData(result.data);
            }
          } else {
            console.error('영화 정보 API 호출 실패:', result.error);
            if (movie.source === 'KMDB_API') {
              setKmdbData(null);
            } else {
              setKobisData(null);
            }
          }
        } catch (error) {
          console.error('영화 정보 API 호출 중 오류:', error);
          if (movie.source === 'KMDB_API') {
            setKmdbData(null);
          } else {
            setKobisData(null);
          }
        } finally {
          clearTimeout(loadingTimer);
          setLoading(false);
        }
      };
      
      fetchMovieInfo();
    } else {
      setKobisData(null);
      setKmdbData(null);
      setLoading(false);
    }
  }, [isOpen, movie]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 콘텐츠 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            영화 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6">
          <div className="space-y-4">
            {/* 영화 제목 */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {movie.title}
              </h2>
              {kobisData?.movieNmEn && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kobisData.movieNmEn}
                </p>
              )}
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  영화 상세 정보를 불러오는 중...
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  잠시만 기다려주세요
                </span>
              </div>
            )}

            {/* KOBIS API 데이터 */}
            {kobisData && !loading && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div className="space-y-3">
                  {kobisData.directors && kobisData.directors.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">감독</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {kobisData.directors.map(d => d.peopleNm).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {kobisData.actors && kobisData.actors.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">주요 배우</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 text-right max-w-[200px]">
                        {kobisData.actors.slice(0, 3).map(actor => actor.peopleNm).join(', ')}
                        {kobisData.actors.length > 3 && ` 외 ${kobisData.actors.length - 3}명`}
                      </span>
                    </div>
                  )}
                  
                  {kobisData.openDt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">개봉일</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {kobisData.openDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                      </span>
                    </div>
                  )}
                  
                  {kobisData.showTm && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">러닝타임</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {kobisData.showTm}분
                      </span>
                    </div>
                  )}
                  
                  {kobisData.genres && kobisData.genres.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">장르</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {kobisData.genres.map(g => g.genreNm).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {kobisData.audits && kobisData.audits.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">관람등급</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {kobisData.audits[0].watchGradeNm}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 영상자료원 영화 정보 (KMDB_API인 경우) */}
            {movie.source === 'KMDB_API' && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div className="space-y-3">
                  {movie.director && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">감독</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{movie.director}</span>
                    </div>
                  )}
                  
                  {kmdbData?.cActors && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">주요 배우</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 text-right max-w-[200px]">
                        {kmdbData.cActors.split(',').slice(0, 3).join(', ')}
                        {kmdbData.cActors.split(',').length > 3 && ` 외 ${kmdbData.cActors.split(',').length - 3}명`}
                      </span>
                    </div>
                  )}
                  
                  {movie.prodYear && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">제작년도</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{movie.prodYear}년</span>
                    </div>
                  )}
                  
                  {movie.runtime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">러닝타임</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{movie.runtime}분</span>
                    </div>
                  )}
                  
                  {kmdbData?.cCodeSubName2 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">관람등급</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{kmdbData.cCodeSubName2}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 상영 정보 - 간단하게 표시 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {movie.time}
                {/* 러닝타임이 있으면 끝나는 시간 계산해서 표시 */}
                {(() => {
                  const runtime = kobisData?.showTm || movie.runtime;
                  if (runtime) {
                    const runtimeMinutes = parseInt(runtime);
                    if (!isNaN(runtimeMinutes)) {
                      // 씨네큐, CGV는 10분 추가
                      const isCineQ = movie.theater?.toLowerCase().includes('씨네큐') || movie.theater?.toLowerCase().includes('cineq');
                      const isCGV = movie.theater?.toLowerCase().includes('cgv');
                      const additionalMinutes = (isCineQ || isCGV) ? 10 : 0;
                      
                      const totalMinutes = runtimeMinutes + additionalMinutes;
                      
                      // 시작 시간 파싱
                      const [startHours, startMinutes] = movie.time.split(':').map(Number);
                      const startTime = new Date();
                      startTime.setHours(startHours, startMinutes, 0, 0);
                      
                      // 끝나는 시간 계산
                      const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000);
                      const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                      
                      return ` - ${endTimeStr}`;
                    }
                  }
                  return '';
                })()}
                <span className="text-gray-500 dark:text-gray-500"> / {movie.theater}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

// 캐시 서비스 import
async function getCacheService() {
  const { cacheService } = await import('@/services/cacheService');
  return cacheService;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const cache = await getCacheService();

    switch (action) {
      case 'stats':
        // 캐시 통계 조회
        const stats = cache.getStats();
        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      case 'cleanup':
        // 만료된 캐시 정리
        cache.cleanup();
        return NextResponse.json({
          success: true,
          message: '만료된 캐시가 정리되었습니다.',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 액션입니다. (stats, cleanup 중 하나를 선택하세요)',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('캐시 API 에러:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '캐시 작업 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    
    const cache = await getCacheService();

    if (!type && !date) {
      // 전체 캐시 삭제
      cache.clear();
      return NextResponse.json({
        success: true,
        message: '전체 캐시가 삭제되었습니다.',
        timestamp: new Date().toISOString()
      });
    } else if (type && date) {
      // 특정 캐시 삭제
      cache.delete(type, date);
      return NextResponse.json({
        success: true,
        message: `${type} (${date}) 캐시가 삭제되었습니다.`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'type과 date를 모두 제공하거나 아무것도 제공하지 마세요.',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('캐시 삭제 API 에러:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '캐시 삭제 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

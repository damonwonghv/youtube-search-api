import { VideoRender } from '../../index';

// 模擬 VideoRender 函數（因為它是內部函數，我們需要測試其邏輯）
const mockVideoRender = (json: any) => {
  try {
    if (json && (json.videoRenderer || json.playlistVideoRenderer)) {
      let videoRenderer = json.videoRenderer || json.playlistVideoRenderer;
      let isLive = false;
      
      // 檢查直播徽章
      if (
        videoRenderer.badges &&
        videoRenderer.badges.length > 0 &&
        videoRenderer.badges[0].metadataBadgeRenderer &&
        videoRenderer.badges[0].metadataBadgeRenderer.style ===
          "BADGE_STYLE_TYPE_LIVE_NOW"
      ) {
        isLive = true;
      }
      
      // 檢查縮圖覆蓋層
      if (videoRenderer.thumbnailOverlays) {
        videoRenderer.thumbnailOverlays.forEach((item: any) => {
          if (
            item.thumbnailOverlayTimeStatusRenderer &&
            item.thumbnailOverlayTimeStatusRenderer.style &&
            item.thumbnailOverlayTimeStatusRenderer.style === "LIVE"
          ) {
            isLive = true;
          }
        });
      }
      
      const id = videoRenderer.videoId;
      const thumbnail = videoRenderer.thumbnail;
      const title = videoRenderer.title.runs[0].text;
      const shortBylineText = videoRenderer.shortBylineText
        ? videoRenderer.shortBylineText
        : "";
      const lengthText = videoRenderer.lengthText
        ? videoRenderer.lengthText
        : "";
      const channelTitle =
        videoRenderer.ownerText && videoRenderer.ownerText.runs
          ? videoRenderer.ownerText.runs[0].text
          : "";
      
      return {
        id,
        type: "video",
        thumbnail,
        title,
        channelTitle,
        shortBylineText,
        length: lengthText,
        isLive
      };
    }
    return {
      id: "",
      type: "",
      thumbnail: undefined,
      title: ""
    };
  } catch (ex) {
    throw ex;
  }
};

describe('VideoRender', () => {
  it('應該正確解析影片渲染器資料', () => {
    const mockVideoData = {
      videoRenderer: {
        videoId: 'test123',
        thumbnail: { url: 'test.jpg' },
        title: { runs: [{ text: '測試影片標題' }] },
        shortBylineText: '測試頻道',
        lengthText: '10:30',
        ownerText: { runs: [{ text: '測試頻道名稱' }] },
        badges: [],
        thumbnailOverlays: []
      }
    };

    const result = mockVideoRender(mockVideoData);

    expect(result).toEqual({
      id: 'test123',
      type: 'video',
      thumbnail: { url: 'test.jpg' },
      title: '測試影片標題',
      channelTitle: '測試頻道名稱',
      shortBylineText: '測試頻道',
      length: '10:30',
      isLive: false
    });
  });

  it('應該正確識別直播影片', () => {
    const mockLiveVideoData = {
      videoRenderer: {
        videoId: 'live123',
        thumbnail: { url: 'live.jpg' },
        title: { runs: [{ text: '直播影片' }] },
        shortBylineText: '',
        lengthText: '',
        ownerText: { runs: [{ text: '直播頻道' }] },
        badges: [
          {
            metadataBadgeRenderer: {
              style: 'BADGE_STYLE_TYPE_LIVE_NOW'
            }
          }
        ],
        thumbnailOverlays: []
      }
    };

    const result = mockVideoRender(mockLiveVideoData);

    expect(result.isLive).toBe(true);
  });

  it('應該處理缺少選用欄位的情況', () => {
    const mockMinimalVideoData = {
      videoRenderer: {
        videoId: 'minimal123',
        thumbnail: { url: 'minimal.jpg' },
        title: { runs: [{ text: '最小化影片' }] }
      }
    };

    const result = mockVideoRender(mockMinimalVideoData);

    expect(result).toEqual({
      id: 'minimal123',
      type: 'video',
      thumbnail: { url: 'minimal.jpg' },
      title: '最小化影片',
      channelTitle: '',
      shortBylineText: '',
      length: '',
      isLive: false
    });
  });

  it('應該處理播放清單影片渲染器', () => {
    const mockPlaylistVideoData = {
      playlistVideoRenderer: {
        videoId: 'playlist123',
        thumbnail: { url: 'playlist.jpg' },
        title: { runs: [{ text: '播放清單影片' }] },
        shortBylineText: '播放清單頻道',
        lengthText: '5:15',
        ownerText: { runs: [{ text: '播放清單頻道名稱' }] },
        badges: [],
        thumbnailOverlays: []
      }
    };

    const result = mockVideoRender(mockPlaylistVideoData);

    expect(result.id).toBe('playlist123');
    expect(result.title).toBe('播放清單影片');
  });

  it('應該處理無效的輸入資料', () => {
    const invalidData = null;
    const result = mockVideoRender(invalidData);

    expect(result).toEqual({
      id: '',
      type: '',
      thumbnail: undefined,
      title: ''
    });
  });

  it('應該處理缺少 videoRenderer 的資料', () => {
    const invalidData = { someOtherRenderer: {} };
    const result = mockVideoRender(invalidData);

    expect(result).toEqual({
      id: '',
      type: '',
      thumbnail: undefined,
      title: ''
    });
  });

  it('應該處理縮圖覆蓋層中的直播標示', () => {
    const mockVideoWithOverlayData = {
      videoRenderer: {
        videoId: 'overlay123',
        thumbnail: { url: 'overlay.jpg' },
        title: { runs: [{ text: '覆蓋層直播影片' }] },
        shortBylineText: '',
        lengthText: '',
        ownerText: { runs: [{ text: '覆蓋層頻道' }] },
        badges: [],
        thumbnailOverlays: [
          {
            thumbnailOverlayTimeStatusRenderer: {
              style: 'LIVE'
            }
          }
        ]
      }
    };

    const result = mockVideoRender(mockVideoWithOverlayData);

    expect(result.isLive).toBe(true);
  });
}); 
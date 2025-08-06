import { 
  SearchResult, 
  PlaylistResult, 
  ChannelResult, 
  VideoDetails, 
  ShortVideo,
  SearchItem 
} from '../../index';

describe('Type Definitions', () => {
  describe('SearchItem', () => {
    it('應該符合 SearchItem 介面定義', () => {
      const searchItem: SearchItem = {
        id: 'test123',
        type: 'video',
        thumbnail: { url: 'test.jpg' },
        title: '測試影片',
        channelTitle: '測試頻道',
        shortBylineText: '測試頻道',
        length: '10:30',
        isLive: false
      };

      expect(searchItem.id).toBe('test123');
      expect(searchItem.type).toBe('video');
      expect(searchItem.thumbnail).toEqual({ url: 'test.jpg' });
      expect(searchItem.title).toBe('測試影片');
      expect(searchItem.channelTitle).toBe('測試頻道');
      expect(searchItem.shortBylineText).toBe('測試頻道');
      expect(searchItem.length).toBe('10:30');
      expect(searchItem.isLive).toBe(false);
    });

    it('應該支援播放清單類型', () => {
      const playlistItem: SearchItem = {
        id: 'PLtest123',
        type: 'playlist',
        thumbnail: [{ url: 'playlist.jpg' }],
        title: '測試播放清單',
        length: '10',
        videoCount: '10',
        isLive: false
      };

      expect(playlistItem.type).toBe('playlist');
      expect(playlistItem.videoCount).toBe('10');
    });

    it('應該支援頻道類型', () => {
      const channelItem: SearchItem = {
        id: 'UCtest123',
        type: 'channel',
        thumbnail: { url: 'channel.jpg' },
        title: '測試頻道'
      };

      expect(channelItem.type).toBe('channel');
    });
  });

  describe('SearchResult', () => {
    it('應該符合 SearchResult 介面定義', () => {
      const searchResult: SearchResult = {
        items: [
          {
            id: 'test123',
            type: 'video',
            thumbnail: { url: 'test.jpg' },
            title: '測試影片',
            channelTitle: '測試頻道',
            shortBylineText: '測試頻道',
            length: '10:30',
            isLive: false
          }
        ],
        nextPage: {
          nextPageToken: 'test_token',
          nextPageContext: { context: 'test_context' }
        }
      };

      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0].id).toBe('test123');
      expect(searchResult.nextPage.nextPageToken).toBe('test_token');
      expect(searchResult.nextPage.nextPageContext).toEqual({ context: 'test_context' });
    });

    it('應該支援空的搜尋結果', () => {
      const emptySearchResult: SearchResult = {
        items: [],
        nextPage: {
          nextPageToken: null,
          nextPageContext: null
        }
      };

      expect(emptySearchResult.items).toHaveLength(0);
      expect(emptySearchResult.nextPage.nextPageToken).toBeNull();
    });
  });

  describe('PlaylistResult', () => {
    it('應該符合 PlaylistResult 介面定義', () => {
      const playlistResult: PlaylistResult = {
        items: [
          {
            id: 'video1',
            type: 'video',
            thumbnail: { url: 'video1.jpg' },
            title: '播放清單影片1',
            channelTitle: '播放清單頻道1',
            shortBylineText: '播放清單頻道1',
            length: '3:15',
            isLive: false
          }
        ],
        metadata: {
          playlistMetadataRenderer: {
            title: '測試播放清單',
            description: '這是測試播放清單的描述'
          }
        }
      };

      expect(playlistResult.items).toHaveLength(1);
      expect(playlistResult.items[0].id).toBe('video1');
      expect(playlistResult.metadata).toBeDefined();
    });
  });

  describe('ChannelResult', () => {
    it('應該符合 ChannelResult 介面定義', () => {
      const channelResult: ChannelResult = {
        title: '測試頻道標題',
        content: {
          someContent: 'test_content'
        }
      };

      expect(channelResult.title).toBe('測試頻道標題');
      expect(channelResult.content).toEqual({ someContent: 'test_content' });
    });
  });

  describe('VideoDetails', () => {
    it('應該符合 VideoDetails 介面定義', () => {
      const videoDetails: VideoDetails = {
        id: 'video123',
        title: '測試影片標題',
        thumbnail: { thumbnails: [{ url: 'video_thumb.jpg' }] },
        isLive: false,
        channel: '測試作者',
        channelId: 'channel123',
        description: '這是測試影片的描述',
        keywords: ['測試', '影片', '關鍵字'],
        suggestion: [
          {
            id: 'suggestion1',
            type: 'video',
            thumbnail: { thumbnails: [{ url: 'suggestion1.jpg' }] },
            title: '建議影片1',
            channelTitle: '建議頻道1',
            shortBylineText: '建議頻道1',
            length: '5:30',
            isLive: false
          }
        ]
      };

      expect(videoDetails.id).toBe('video123');
      expect(videoDetails.title).toBe('測試影片標題');
      expect(videoDetails.channel).toBe('測試作者');
      expect(videoDetails.channelId).toBe('channel123');
      expect(videoDetails.description).toBe('這是測試影片的描述');
      expect(videoDetails.keywords).toEqual(['測試', '影片', '關鍵字']);
      expect(videoDetails.isLive).toBe(false);
      expect(videoDetails.suggestion).toHaveLength(1);
      expect(videoDetails.suggestion[0].id).toBe('suggestion1');
    });

    it('應該支援直播影片', () => {
      const liveVideoDetails: VideoDetails = {
        id: 'live123',
        title: '直播影片標題',
        thumbnail: { thumbnails: [{ url: 'live_thumb.jpg' }] },
        isLive: true,
        channel: '直播作者',
        channelId: 'liveChannel123',
        description: '這是直播影片的描述',
        keywords: ['直播', '影片'],
        suggestion: []
      };

      expect(liveVideoDetails.isLive).toBe(true);
    });
  });

  describe('ShortVideo', () => {
    it('應該符合 ShortVideo 介面定義', () => {
      const shortVideo: ShortVideo = {
        id: 'short123',
        type: 'reel',
        thumbnail: { url: 'short.jpg' },
        title: 'Short 影片標題',
        inlinePlaybackEndpoint: {
          watchEndpoint: {
            videoId: 'short123'
          }
        }
      };

      expect(shortVideo.id).toBe('short123');
      expect(shortVideo.type).toBe('reel');
      expect(shortVideo.thumbnail).toEqual({ url: 'short.jpg' });
      expect(shortVideo.title).toBe('Short 影片標題');
      expect(shortVideo.inlinePlaybackEndpoint).toEqual({
        watchEndpoint: {
          videoId: 'short123'
        }
      });
    });

    it('應該支援空的 inlinePlaybackEndpoint', () => {
      const shortVideoWithEmptyEndpoint: ShortVideo = {
        id: 'short456',
        type: 'reel',
        thumbnail: { url: 'short456.jpg' },
        title: 'Short 影片標題2',
        inlinePlaybackEndpoint: {}
      };

      expect(shortVideoWithEmptyEndpoint.inlinePlaybackEndpoint).toEqual({});
    });
  });

  describe('型別相容性', () => {
    it('應該確保 SearchItem 可以包含所有必要的屬性', () => {
      const completeSearchItem: SearchItem = {
        id: 'complete123',
        type: 'video',
        thumbnail: { url: 'complete.jpg' },
        title: '完整影片',
        channelTitle: '完整頻道',
        shortBylineText: '完整頻道',
        length: '15:30',
        isLive: false,
        videos: [],
        videoCount: '5'
      };

      expect(completeSearchItem).toHaveProperty('id');
      expect(completeSearchItem).toHaveProperty('type');
      expect(completeSearchItem).toHaveProperty('thumbnail');
      expect(completeSearchItem).toHaveProperty('title');
      expect(completeSearchItem).toHaveProperty('channelTitle');
      expect(completeSearchItem).toHaveProperty('shortBylineText');
      expect(completeSearchItem).toHaveProperty('length');
      expect(completeSearchItem).toHaveProperty('isLive');
      expect(completeSearchItem).toHaveProperty('videos');
      expect(completeSearchItem).toHaveProperty('videoCount');
    });

    it('應該確保型別定義支援可選屬性', () => {
      const minimalSearchItem: SearchItem = {
        id: 'minimal123',
        type: 'video',
        thumbnail: { url: 'minimal.jpg' },
        title: '最小化影片'
      };

      expect(minimalSearchItem.id).toBe('minimal123');
      expect(minimalSearchItem.type).toBe('video');
      expect(minimalSearchItem.title).toBe('最小化影片');
      expect(minimalSearchItem.channelTitle).toBeUndefined();
      expect(minimalSearchItem.shortBylineText).toBeUndefined();
      expect(minimalSearchItem.length).toBeUndefined();
      expect(minimalSearchItem.isLive).toBeUndefined();
    });
  });
}); 
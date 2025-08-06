import nock from 'nock';
import { GetListByKeyword, YouTubeAPIError } from '../../index';

describe('GetListByKeyword Integration Tests', () => {
  const youtubeEndpoint = 'https://www.youtube.com';

  beforeEach(() => {
    // 清理所有模擬
    nock.cleanAll();
  });

  it('應該成功搜尋影片並返回結果', async () => {
    // 模擬 YouTube 搜尋頁面回應
    const mockSearchResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"test123","thumbnail":{"url":"test.jpg"},"title":{"runs":[{"text":"測試影片"}]},"shortBylineText":"測試頻道","lengthText":"10:30","ownerText":{"runs":[{"text":"測試頻道名稱"}]},"badges":[],"thumbnailOverlays":[]}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "test_api_key";
          var INNERTUBE_CONTEXT = {"context":"test_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '測試關鍵字' })
      .reply(200, mockSearchResponse);

    const result = await GetListByKeyword('測試關鍵字');

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('test123');
    expect(result.items[0].title).toBe('測試影片');
    expect(result.items[0].type).toBe('video');
    expect(result.nextPage.nextPageToken).toBe('test_api_key');
  });

  it('應該處理影片搜尋選項', async () => {
    const mockVideoSearchResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"video123","thumbnail":{"url":"video.jpg"},"title":{"runs":[{"text":"影片搜尋結果"}]},"shortBylineText":"影片頻道","lengthText":"5:15","ownerText":{"runs":[{"text":"影片頻道名稱"}]},"badges":[],"thumbnailOverlays":[]}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "video_api_key";
          var INNERTUBE_CONTEXT = {"context":"video_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '影片', sp: 'EgIQAQ%3D%3D' })
      .reply(200, mockVideoSearchResponse);

    const result = await GetListByKeyword('影片', false, 0, [{ type: 'video' }]);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('video123');
  });

  it('應該處理頻道搜尋選項', async () => {
    const mockChannelSearchResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"channelRenderer":{"channelId":"channel123","thumbnail":{"url":"channel.jpg"},"title":{"simpleText":"測試頻道"}}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "channel_api_key";
          var INNERTUBE_CONTEXT = {"context":"channel_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '頻道', sp: 'EgIQAg%3D%3D' })
      .reply(200, mockChannelSearchResponse);

    const result = await GetListByKeyword('頻道', false, 0, [{ type: 'channel' }]);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('channel123');
    expect(result.items[0].type).toBe('channel');
  });

  it('應該處理播放清單搜尋選項', async () => {
    const mockPlaylistSearchResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"playlistRenderer":{"playlistId":"playlist123","thumbnails":[{"url":"playlist.jpg"}],"title":{"simpleText":"測試播放清單"},"videoCount":"10"}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "playlist_api_key";
          var INNERTUBE_CONTEXT = {"context":"playlist_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '播放清單', sp: 'EgIQAw%3D%3D' })
      .reply(200, mockPlaylistSearchResponse);

    const result = await GetListByKeyword('播放清單', true, 0, [{ type: 'playlist' }]);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('playlist123');
    expect(result.items[0].type).toBe('playlist');
  });

  it('應該處理結果數量限制', async () => {
    const mockMultipleResultsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"video1","thumbnail":{"url":"video1.jpg"},"title":{"runs":[{"text":"影片1"}]},"shortBylineText":"頻道1","lengthText":"1:00","ownerText":{"runs":[{"text":"頻道1名稱"}]},"badges":[],"thumbnailOverlays":[]}},{"videoRenderer":{"videoId":"video2","thumbnail":{"url":"video2.jpg"},"title":{"runs":[{"text":"影片2"}]},"shortBylineText":"頻道2","lengthText":"2:00","ownerText":{"runs":[{"text":"頻道2名稱"}]},"badges":[],"thumbnailOverlays":[]}},{"videoRenderer":{"videoId":"video3","thumbnail":{"url":"video3.jpg"},"title":{"runs":[{"text":"影片3"}]},"shortBylineText":"頻道3","lengthText":"3:00","ownerText":{"runs":[{"text":"頻道3名稱"}]},"badges":[],"thumbnailOverlays":[]}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "limit_api_key";
          var INNERTUBE_CONTEXT = {"context":"limit_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '多結果' })
      .reply(200, mockMultipleResultsResponse);

    const result = await GetListByKeyword('多結果', false, 2);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('video1');
    expect(result.items[1].id).toBe('video2');
  });

  it('應該處理網路錯誤', async () => {
    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '錯誤測試' })
      .replyWithError('網路錯誤');

    await expect(GetListByKeyword('錯誤測試')).rejects.toThrow();
  });

  it('應該處理無效的 YouTube 回應', async () => {
    const invalidResponse = `
      <html>
        <body>
          <h1>錯誤頁面</h1>
        </body>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '無效回應' })
      .reply(200, invalidResponse);

    await expect(GetListByKeyword('無效回應')).rejects.toThrow(YouTubeAPIError);
  });

  it('應該處理直播影片識別', async () => {
    const mockLiveVideoResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"live123","thumbnail":{"url":"live.jpg"},"title":{"runs":[{"text":"直播影片"}]},"shortBylineText":"直播頻道","lengthText":"","ownerText":{"runs":[{"text":"直播頻道名稱"}]},"badges":[{"metadataBadgeRenderer":{"style":"BADGE_STYLE_TYPE_LIVE_NOW"}}],"thumbnailOverlays":[]}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "live_api_key";
          var INNERTUBE_CONTEXT = {"context":"live_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/results')
      .query({ search_query: '直播' })
      .reply(200, mockLiveVideoResponse);

    const result = await GetListByKeyword('直播');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].isLive).toBe(true);
  });
}); 
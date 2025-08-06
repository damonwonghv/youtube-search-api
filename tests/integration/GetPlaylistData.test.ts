import nock from 'nock';
import { GetPlaylistData, YouTubeAPIError } from '../../index';

describe('GetPlaylistData Integration Tests', () => {
  const youtubeEndpoint = 'https://www.youtube.com';

  beforeEach(() => {
    nock.cleanAll();
  });

  it('應該成功獲取播放清單資料', async () => {
    const playlistId = 'PLtest123';

    const mockPlaylistResponse = `
      <html>
        <script>
          var ytInitialData = {"metadata":{"playlistMetadataRenderer":{"title":"測試播放清單","description":"這是測試播放清單的描述"}},"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"playlistVideoListRenderer":{"contents":[{"playlistVideoRenderer":{"videoId":"video1","thumbnail":{"url":"video1.jpg"},"title":{"runs":[{"text":"播放清單影片1"}]},"shortBylineText":"播放清單頻道1","lengthText":"3:15","ownerText":{"runs":[{"text":"播放清單頻道名稱1"}]},"badges":[],"thumbnailOverlays":[]}},{"playlistVideoRenderer":{"videoId":"video2","thumbnail":{"url":"video2.jpg"},"title":{"runs":[{"text":"播放清單影片2"}]},"shortBylineText":"播放清單頻道2","lengthText":"5:30","ownerText":{"runs":[{"text":"播放清單頻道名稱2"}]},"badges":[],"thumbnailOverlays":[]}}]}}]}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "playlist_api_key";
          var INNERTUBE_CONTEXT = {"context":"playlist_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, mockPlaylistResponse);

    const result = await GetPlaylistData(playlistId);

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('video1');
    expect(result.items[0].title).toBe('播放清單影片1');
    expect(result.items[0].type).toBe('video');
    expect(result.items[1].id).toBe('video2');
    expect(result.items[1].title).toBe('播放清單影片2');
    expect(result.metadata).toBeDefined();
  });

  it('應該處理結果數量限制', async () => {
    const playlistId = 'PLlimit123';

    const mockLimitPlaylistResponse = `
      <html>
        <script>
          var ytInitialData = {"metadata":{"playlistMetadataRenderer":{"title":"限制播放清單","description":"限制結果的播放清單"}},"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"playlistVideoListRenderer":{"contents":[{"playlistVideoRenderer":{"videoId":"limitVideo1","thumbnail":{"url":"limitVideo1.jpg"},"title":{"runs":[{"text":"限制影片1"}]},"shortBylineText":"限制頻道1","lengthText":"2:15","ownerText":{"runs":[{"text":"限制頻道名稱1"}]},"badges":[],"thumbnailOverlays":[]}},{"playlistVideoRenderer":{"videoId":"limitVideo2","thumbnail":{"url":"limitVideo2.jpg"},"title":{"runs":[{"text":"限制影片2"}]},"shortBylineText":"限制頻道2","lengthText":"4:30","ownerText":{"runs":[{"text":"限制頻道名稱2"}]},"badges":[],"thumbnailOverlays":[]}},{"playlistVideoRenderer":{"videoId":"limitVideo3","thumbnail":{"url":"limitVideo3.jpg"},"title":{"runs":[{"text":"限制影片3"}]},"shortBylineText":"限制頻道3","lengthText":"6:45","ownerText":{"runs":[{"text":"限制頻道名稱3"}]},"badges":[],"thumbnailOverlays":[]}}]}}]}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, mockLimitPlaylistResponse);

    const result = await GetPlaylistData(playlistId, 2);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('limitVideo1');
    expect(result.items[1].id).toBe('limitVideo2');
  });

  it('應該處理空的播放清單', async () => {
    const playlistId = 'PLempty123';

    const mockEmptyPlaylistResponse = `
      <html>
        <script>
          var ytInitialData = {"metadata":{"playlistMetadataRenderer":{"title":"空播放清單","description":"沒有影片的播放清單"}},"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"playlistVideoListRenderer":{"contents":[]}}]}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, mockEmptyPlaylistResponse);

    const result = await GetPlaylistData(playlistId);

    expect(result.items).toHaveLength(0);
    expect(result.metadata).toBeDefined();
  });

  it('應該處理直播影片在播放清單中', async () => {
    const playlistId = 'PLlive123';

    const mockLivePlaylistResponse = `
      <html>
        <script>
          var ytInitialData = {"metadata":{"playlistMetadataRenderer":{"title":"直播播放清單","description":"包含直播影片的播放清單"}},"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"playlistVideoListRenderer":{"contents":[{"playlistVideoRenderer":{"videoId":"liveVideo1","thumbnail":{"url":"liveVideo1.jpg"},"title":{"runs":[{"text":"直播影片1"}]},"shortBylineText":"直播頻道1","lengthText":"","ownerText":{"runs":[{"text":"直播頻道名稱1"}]},"badges":[{"metadataBadgeRenderer":{"style":"BADGE_STYLE_TYPE_LIVE_NOW"}}],"thumbnailOverlays":[]}}]}}]}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, mockLivePlaylistResponse);

    const result = await GetPlaylistData(playlistId);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].isLive).toBe(true);
    expect(result.items[0].id).toBe('liveVideo1');
  });

  it('應該處理網路錯誤', async () => {
    const playlistId = 'PLerror123';

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .replyWithError('網路錯誤');

    await expect(GetPlaylistData(playlistId)).rejects.toThrow();
  });

  it('應該處理無效的播放清單回應', async () => {
    const playlistId = 'PLinvalid123';

    const invalidResponse = `
      <html>
        <body>
          <h1>播放清單不存在</h1>
        </body>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, invalidResponse);

    await expect(GetPlaylistData(playlistId)).rejects.toThrow(YouTubeAPIError);
  });

  it('應該處理無效的播放清單結構', async () => {
    const playlistId = 'PLinvalidStructure123';

    const mockInvalidStructureResponse = `
      <html>
        <script>
          var ytInitialData = {"metadata":{"playlistMetadataRenderer":{"title":"無效結構播放清單"}},"contents":{"someOtherRenderer":{"someData":"should cause error"}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/playlist')
      .query({ list: playlistId })
      .reply(200, mockInvalidStructureResponse);

    await expect(GetPlaylistData(playlistId)).rejects.toThrow(YouTubeAPIError);
  });
}); 
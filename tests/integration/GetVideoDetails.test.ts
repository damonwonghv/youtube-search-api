import nock from 'nock';
import { GetVideoDetails, YouTubeAPIError } from '../../index';

describe('GetVideoDetails Integration Tests', () => {
  const youtubeEndpoint = 'https://www.youtube.com';

  beforeEach(() => {
    nock.cleanAll();
  });

  it('應該成功獲取影片詳細資訊', async () => {
    const videoId = 'test123';

    // 模擬影片頁面回應
    const mockVideoPageResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnWatchNextResults":{"results":{"results":{"contents":[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":"測試影片標題"}]},"viewCount":{"videoViewCountRenderer":{"isLive":false}}}},{"videoSecondaryInfoRenderer":{"owner":{"videoOwnerRenderer":{"title":{"runs":[{"text":"測試頻道名稱"}]}}}}]}},"secondaryResults":{"secondaryResults":{"results":[{"compactVideoRenderer":{"videoId":"suggestion1","thumbnail":{"thumbnails":[{"url":"suggestion1.jpg"}]},"title":{"simpleText":"建議影片1"},"shortBylineText":{"runs":[{"text":"建議頻道1"}]},"lengthText":"5:30","badges":[]}}]}}}}};
          var INNERTUBE_API_KEY = "test_api_key";
          var INNERTUBE_CONTEXT = {"context":"test_context"};
        </script>
        <script>
          var ytInitialPlayerResponse = {"videoDetails":{"videoId":"${videoId}","thumbnail":{"thumbnails":[{"url":"video_thumb.jpg"}]},"author":"測試作者","channelId":"channel123","shortDescription":"這是測試影片的描述","keywords":["測試","影片","關鍵字"]}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, mockVideoPageResponse);

    const result = await GetVideoDetails(videoId);

    expect(result).toBeDefined();
    expect(result.id).toBe(videoId);
    expect(result.title).toBe('測試影片標題');
    expect(result.channel).toBe('測試作者');
    expect(result.channelId).toBe('channel123');
    expect(result.description).toBe('這是測試影片的描述');
    expect(result.keywords).toEqual(['測試', '影片', '關鍵字']);
    expect(result.isLive).toBe(false);
    expect(result.suggestion).toHaveLength(1);
    expect(result.suggestion[0].id).toBe('suggestion1');
  });

  it('應該正確識別直播影片', async () => {
    const videoId = 'live123';

    const mockLiveVideoResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnWatchNextResults":{"results":{"results":{"contents":[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":"直播影片標題"}]},"viewCount":{"videoViewCountRenderer":{"isLive":true}}}},{"videoSecondaryInfoRenderer":{"owner":{"videoOwnerRenderer":{"title":{"runs":[{"text":"直播頻道名稱"}]}}}}]}},"secondaryResults":{"secondaryResults":{"results":[]}}}}};
        </script>
        <script>
          var ytInitialPlayerResponse = {"videoDetails":{"videoId":"${videoId}","thumbnail":{"thumbnails":[{"url":"live_thumb.jpg"}]},"author":"直播作者","channelId":"liveChannel123","shortDescription":"這是直播影片的描述","keywords":["直播","影片"]}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, mockLiveVideoResponse);

    const result = await GetVideoDetails(videoId);

    expect(result.isLive).toBe(true);
    expect(result.title).toBe('直播影片標題');
  });

  it('應該處理缺少作者資訊的情況', async () => {
    const videoId = 'noAuthor123';

    const mockNoAuthorResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnWatchNextResults":{"results":{"results":{"contents":[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":"無作者影片"}]},"viewCount":{"videoViewCountRenderer":{"isLive":false}}}},{"videoSecondaryInfoRenderer":{"owner":{"videoOwnerRenderer":{"title":{"runs":[{"text":"備用頻道名稱"}]}}}}]}},"secondaryResults":{"secondaryResults":{"results":[]}}}}};
        </script>
        <script>
          var ytInitialPlayerResponse = {"videoDetails":{"videoId":"${videoId}","thumbnail":{"thumbnails":[{"url":"noAuthor_thumb.jpg"}]},"channelId":"noAuthorChannel123","shortDescription":"無作者影片描述","keywords":["無作者"]}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, mockNoAuthorResponse);

    const result = await GetVideoDetails(videoId);

    expect(result.channel).toBe('備用頻道名稱');
  });

  it('應該處理多個建議影片', async () => {
    const videoId = 'multiSuggestion123';

    const mockMultiSuggestionResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnWatchNextResults":{"results":{"results":{"contents":[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":"多建議影片"}]},"viewCount":{"videoViewCountRenderer":{"isLive":false}}}},{"videoSecondaryInfoRenderer":{"owner":{"videoOwnerRenderer":{"title":{"runs":[{"text":"多建議頻道"}]}}}}]}},"secondaryResults":{"secondaryResults":{"results":[{"compactVideoRenderer":{"videoId":"suggestion1","thumbnail":{"thumbnails":[{"url":"suggestion1.jpg"}]},"title":{"simpleText":"建議影片1"},"shortBylineText":{"runs":[{"text":"建議頻道1"}]},"lengthText":"3:15","badges":[]}},{"compactVideoRenderer":{"videoId":"suggestion2","thumbnail":{"thumbnails":[{"url":"suggestion2.jpg"}]},"title":{"simpleText":"建議影片2"},"shortBylineText":{"runs":[{"text":"建議頻道2"}]},"lengthText":"7:45","badges":[]}},{"someOtherRenderer":{"someData":"should be filtered out"}}]}}}}};
        </script>
        <script>
          var ytInitialPlayerResponse = {"videoDetails":{"videoId":"${videoId}","thumbnail":{"thumbnails":[{"url":"multiSuggestion_thumb.jpg"}]},"author":"多建議作者","channelId":"multiSuggestionChannel123","shortDescription":"多建議影片描述","keywords":["多建議"]}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, mockMultiSuggestionResponse);

    const result = await GetVideoDetails(videoId);

    expect(result.suggestion).toHaveLength(2);
    expect(result.suggestion[0].id).toBe('suggestion1');
    expect(result.suggestion[1].id).toBe('suggestion2');
  });

  it('應該處理網路錯誤', async () => {
    const videoId = 'error123';

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .replyWithError('網路錯誤');

    await expect(GetVideoDetails(videoId)).rejects.toThrow();
  });

  it('應該處理無效的影片頁面回應', async () => {
    const videoId = 'invalid123';

    const invalidResponse = `
      <html>
        <body>
          <h1>影片不存在</h1>
        </body>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, invalidResponse);

    await expect(GetVideoDetails(videoId)).rejects.toThrow(YouTubeAPIError);
  });

  it('應該處理缺少播放器回應的情況', async () => {
    const videoId = 'noPlayer123';

    const mockNoPlayerResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnWatchNextResults":{"results":{"results":{"contents":[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":"無播放器影片"}]},"viewCount":{"videoViewCountRenderer":{"isLive":false}}}},{"videoSecondaryInfoRenderer":{"owner":{"videoOwnerRenderer":{"title":{"runs":[{"text":"無播放器頻道"}]}}}}]}},"secondaryResults":{"secondaryResults":{"results":[]}}}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get(`/watch`)
      .query({ v: videoId })
      .reply(200, mockNoPlayerResponse);

    await expect(GetVideoDetails(videoId)).rejects.toThrow(YouTubeAPIError);
  });
}); 
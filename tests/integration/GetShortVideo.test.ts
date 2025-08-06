import nock from 'nock';
import { GetShortVideo, YouTubeAPIError } from '../../index';

describe('GetShortVideo Integration Tests', () => {
  const youtubeEndpoint = 'https://www.youtube.com';

  beforeEach(() => {
    nock.cleanAll();
  });

  it('應該成功獲取 Shorts 影片', async () => {
    const mockShortsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"Shorts"}]},"contents":[{"richItemRenderer":{"content":{"reelItemRenderer":{"videoId":"short1","thumbnail":{"thumbnails":[{"url":"short1.jpg"}]},"headline":{"simpleText":"Short 影片1"},"inlinePlaybackEndpoint":{"watchEndpoint":{"videoId":"short1"}}}}}},{"richItemRenderer":{"content":{"reelItemRenderer":{"videoId":"short2","thumbnail":{"thumbnails":[{"url":"short2.jpg"}]},"headline":{"simpleText":"Short 影片2"},"inlinePlaybackEndpoint":{"watchEndpoint":{"videoId":"short2"}}}}}}]}}}]}}]}}]}}};
          var INNERTUBE_API_KEY = "shorts_api_key";
          var INNERTUBE_CONTEXT = {"context":"shorts_context"};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockShortsResponse);

    const result = await GetShortVideo();

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('short1');
    expect(result[0].title).toBe('Short 影片1');
    expect(result[0].type).toBe('reel');
    expect(result[0].thumbnail).toEqual({ url: 'short1.jpg' });
    expect(result[0].inlinePlaybackEndpoint).toEqual({ watchEndpoint: { videoId: 'short1' } });
    expect(result[1].id).toBe('short2');
    expect(result[1].title).toBe('Short 影片2');
  });

  it('應該處理空的 Shorts 結果', async () => {
    const mockEmptyShortsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"Shorts"}]},"contents":[]}}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockEmptyShortsResponse);

    const result = await GetShortVideo();

    expect(result).toHaveLength(0);
  });

  it('應該處理缺少 inlinePlaybackEndpoint 的 Shorts', async () => {
    const mockNoEndpointShortsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"Shorts"}]},"contents":[{"richItemRenderer":{"content":{"reelItemRenderer":{"videoId":"noEndpointShort","thumbnail":{"thumbnails":[{"url":"noEndpointShort.jpg"}]},"headline":{"simpleText":"無端點 Short"}}}}}}]}}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockNoEndpointShortsResponse);

    const result = await GetShortVideo();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('noEndpointShort');
    expect(result[0].inlinePlaybackEndpoint).toEqual({});
  });

  it('應該處理複雜的縮圖結構', async () => {
    const mockComplexThumbnailShortsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"Shorts"}]},"contents":[{"richItemRenderer":{"content":{"reelItemRenderer":{"videoId":"complexThumbShort","thumbnail":{"thumbnails":[{"url":"complexThumb1.jpg","width":90,"height":120},{"url":"complexThumb2.jpg","width":180,"height":240},{"url":"complexThumb3.jpg","width":360,"height":480}]},"headline":{"simpleText":"複雜縮圖 Short"},"inlinePlaybackEndpoint":{"watchEndpoint":{"videoId":"complexThumbShort"}}}}}}]}}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockComplexThumbnailShortsResponse);

    const result = await GetShortVideo();

    expect(result).toHaveLength(1);
    expect(result[0].thumbnail).toHaveLength(3);
    expect(result[0].thumbnail[0].url).toBe('complexThumb1.jpg');
    expect(result[0].thumbnail[2].width).toBe(360);
  });

  it('應該過濾非 Shorts 內容', async () => {
    const mockMixedContentResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"Shorts"}]},"contents":[{"richItemRenderer":{"content":{"reelItemRenderer":{"videoId":"validShort","thumbnail":{"thumbnails":[{"url":"validShort.jpg"}]},"headline":{"simpleText":"有效 Short"},"inlinePlaybackEndpoint":{"watchEndpoint":{"videoId":"validShort"}}}}}}]}}}]}},{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"其他內容"}]},"contents":[{"richItemRenderer":{"content":{"videoRenderer":{"videoId":"regularVideo","thumbnail":{"url":"regularVideo.jpg"},"title":{"runs":[{"text":"一般影片"}]}}}}]}}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockMixedContentResponse);

    const result = await GetShortVideo();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('validShort');
    expect(result[0].title).toBe('有效 Short');
  });

  it('應該處理網路錯誤', async () => {
    nock(youtubeEndpoint)
      .get('/')
      .replyWithError('網路錯誤');

    await expect(GetShortVideo()).rejects.toThrow();
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
      .get('/')
      .reply(200, invalidResponse);

    await expect(GetShortVideo()).rejects.toThrow(YouTubeAPIError);
  });

  it('應該處理缺少 Shorts 區段的情況', async () => {
    const mockNoShortsResponse = `
      <html>
        <script>
          var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"richGridRenderer":{"contents":[{"richSectionRenderer":{"content":{"richShelfRenderer":{"title":{"runs":[{"text":"推薦影片"}]},"contents":[]}}}]}}]}}]}}};
        </script>
      </html>
    `;

    nock(youtubeEndpoint)
      .get('/')
      .reply(200, mockNoShortsResponse);

    const result = await GetShortVideo();

    expect(result).toHaveLength(0);
  });
}); 
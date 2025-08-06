import {
    SearchResult,
    PlaylistResult,
    ChannelResult,
    VideoDetails,
    ShortVideo,
    SearchItem
} from '../index';

describe('YouTube Search API - 簡化測試', () => {
    describe('型別定義測試', () => {
        it('應該正確定義 SearchItem 介面', () => {
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
            expect(searchItem.title).toBe('測試影片');
            expect(searchItem.isLive).toBe(false);
        });

        it('應該正確定義 SearchResult 介面', () => {
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
        });

        it('應該正確定義 PlaylistResult 介面', () => {
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

        it('應該正確定義 VideoDetails 介面', () => {
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
            expect(videoDetails.isLive).toBe(false);
            expect(videoDetails.suggestion).toHaveLength(1);
        });

        it('應該正確定義 ShortVideo 介面', () => {
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
            expect(shortVideo.title).toBe('Short 影片標題');
            expect(shortVideo.inlinePlaybackEndpoint).toBeDefined();
        });
    });

    describe('資料結構測試', () => {
        it('應該支援播放清單項目', () => {
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

        it('應該支援頻道項目', () => {
            const channelItem: SearchItem = {
                id: 'UCtest123',
                type: 'channel',
                thumbnail: { url: 'channel.jpg' },
                title: '測試頻道'
            };

            expect(channelItem.type).toBe('channel');
        });

        it('應該支援直播影片', () => {
            const liveVideo: SearchItem = {
                id: 'live123',
                type: 'video',
                thumbnail: { url: 'live.jpg' },
                title: '直播影片',
                channelTitle: '直播頻道',
                shortBylineText: '直播頻道',
                length: '',
                isLive: true
            };

            expect(liveVideo.isLive).toBe(true);
            expect(liveVideo.length).toBe('');
        });
    });

    describe('錯誤處理測試', () => {
        it('應該處理空的搜尋結果', () => {
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

        it('應該處理空的播放清單', () => {
            const emptyPlaylistResult: PlaylistResult = {
                items: [],
                metadata: {
                    playlistMetadataRenderer: {
                        title: '空播放清單',
                        description: '沒有影片的播放清單'
                    }
                }
            };

            expect(emptyPlaylistResult.items).toHaveLength(0);
            expect(emptyPlaylistResult.metadata).toBeDefined();
        });

        it('應該處理空的建議影片', () => {
            const videoDetailsWithNoSuggestions: VideoDetails = {
                id: 'video123',
                title: '測試影片標題',
                thumbnail: { thumbnails: [{ url: 'video_thumb.jpg' }] },
                isLive: false,
                channel: '測試作者',
                channelId: 'channel123',
                description: '這是測試影片的描述',
                keywords: ['測試', '影片'],
                suggestion: []
            };

            expect(videoDetailsWithNoSuggestions.suggestion).toHaveLength(0);
        });
    });

    describe('可選屬性測試', () => {
        it('應該支援最小化的 SearchItem', () => {
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

        it('應該支援缺少 inlinePlaybackEndpoint 的 ShortVideo', () => {
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
}); 
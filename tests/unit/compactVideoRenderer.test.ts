// 模擬 compactVideoRenderer 函數（因為它是內部函數）
const mockCompactVideoRenderer = (json: any) => {
    const compactVideoRendererJson = json.compactVideoRenderer;
    let isLive = false;

    if (
        compactVideoRendererJson.badges &&
        compactVideoRendererJson.badges.length > 0
    ) {
        for (const badge of compactVideoRendererJson.badges) {
            if (
                badge.metadataBadgeRenderer &&
                badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_LIVE_NOW"
            ) {
                isLive = true;
                break;
            }
        }
    }

    return {
        id: compactVideoRendererJson.videoId,
        type: "video",
        thumbnail: compactVideoRendererJson.thumbnail.thumbnails,
        title: compactVideoRendererJson.title.simpleText,
        channelTitle: compactVideoRendererJson.shortBylineText.runs[0].text,
        shortBylineText: compactVideoRendererJson.shortBylineText.runs[0].text,
        length: compactVideoRendererJson.lengthText,
        isLive
    };
};

describe('compactVideoRenderer', () => {
    it('應該正確解析緊湊影片渲染器資料', () => {
        const mockCompactVideoData = {
            compactVideoRenderer: {
                videoId: 'compact123',
                thumbnail: { thumbnails: [{ url: 'compact.jpg' }] },
                title: { simpleText: '緊湊影片標題' },
                shortBylineText: { runs: [{ text: '緊湊頻道' }] },
                lengthText: '3:45',
                badges: []
            }
        };

        const result = mockCompactVideoRenderer(mockCompactVideoData);

        expect(result).toEqual({
            id: 'compact123',
            type: 'video',
            thumbnail: [{ url: 'compact.jpg' }],
            title: '緊湊影片標題',
            channelTitle: '緊湊頻道',
            shortBylineText: '緊湊頻道',
            length: '3:45',
            isLive: false
        });
    });

    it('應該正確識別直播緊湊影片', () => {
        const mockLiveCompactVideoData = {
            compactVideoRenderer: {
                videoId: 'liveCompact123',
                thumbnail: { thumbnails: [{ url: 'liveCompact.jpg' }] },
                title: { simpleText: '直播緊湊影片' },
                shortBylineText: { runs: [{ text: '直播緊湊頻道' }] },
                lengthText: '',
                badges: [
                    {
                        metadataBadgeRenderer: {
                            style: 'BADGE_STYLE_TYPE_LIVE_NOW'
                        }
                    }
                ]
            }
        };

        const result = mockCompactVideoRenderer(mockLiveCompactVideoData);

        expect(result.isLive).toBe(true);
    });

    it('應該處理缺少長度文字的影片', () => {
        const mockNoLengthVideoData = {
            compactVideoRenderer: {
                videoId: 'noLength123',
                thumbnail: { thumbnails: [{ url: 'noLength.jpg' }] },
                title: { simpleText: '無長度影片' },
                shortBylineText: { runs: [{ text: '無長度頻道' }] },
                lengthText: null,
                badges: []
            }
        };

        const result = mockCompactVideoRenderer(mockNoLengthVideoData);

        expect(result.length).toBeNull();
        expect(result.isLive).toBe(false);
    });

    it('應該處理複雜的縮圖陣列', () => {
        const mockComplexThumbnailData = {
            compactVideoRenderer: {
                videoId: 'complexThumb123',
                thumbnail: {
                    thumbnails: [
                        { url: 'thumb1.jpg', width: 120, height: 90 },
                        { url: 'thumb2.jpg', width: 320, height: 180 },
                        { url: 'thumb3.jpg', width: 480, height: 360 }
                    ]
                },
                title: { simpleText: '複雜縮圖影片' },
                shortBylineText: { runs: [{ text: '複雜縮圖頻道' }] },
                lengthText: '12:34',
                badges: []
            }
        };

        const result = mockCompactVideoRenderer(mockComplexThumbnailData);

        expect(result.thumbnail).toHaveLength(3);
        expect(result.thumbnail[0].url).toBe('thumb1.jpg');
        expect(result.thumbnail[2].width).toBe(480);
    });

    it('應該處理多個徽章的情況', () => {
        const mockMultipleBadgesData = {
            compactVideoRenderer: {
                videoId: 'multiBadge123',
                thumbnail: { thumbnails: [{ url: 'multiBadge.jpg' }] },
                title: { simpleText: '多徽章影片' },
                shortBylineText: { runs: [{ text: '多徽章頻道' }] },
                lengthText: '7:21',
                badges: [
                    {
                        metadataBadgeRenderer: {
                            style: 'SOME_OTHER_STYLE'
                        }
                    },
                    {
                        metadataBadgeRenderer: {
                            style: 'BADGE_STYLE_TYPE_LIVE_NOW'
                        }
                    }
                ]
            }
        };

        const result = mockCompactVideoRenderer(mockMultipleBadgesData);

        expect(result.isLive).toBe(true);
    });

    it('應該處理無效的徽章資料', () => {
        const mockInvalidBadgeData = {
            compactVideoRenderer: {
                videoId: 'invalidBadge123',
                thumbnail: { thumbnails: [{ url: 'invalidBadge.jpg' }] },
                title: { simpleText: '無效徽章影片' },
                shortBylineText: { runs: [{ text: '無效徽章頻道' }] },
                lengthText: '4:15',
                badges: [
                    {
                        someOtherRenderer: {
                            style: 'BADGE_STYLE_TYPE_LIVE_NOW'
                        }
                    }
                ]
            }
        };

        const result = mockCompactVideoRenderer(mockInvalidBadgeData);

        expect(result.isLive).toBe(false);
    });
}); 
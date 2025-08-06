import { YouTubeAPIError, ErrorHandler, ErrorCodes } from '../../index';

describe('ErrorHandler Tests', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        errorHandler = ErrorHandler.getInstance();
    });

    describe('YouTubeAPIError', () => {
        it('應該正確創建 YouTubeAPIError 實例', () => {
            const error = new YouTubeAPIError('測試錯誤', 'TEST_ERROR', 400);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(YouTubeAPIError);
            expect(error.name).toBe('YouTubeAPIError');
            expect(error.message).toBe('測試錯誤');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.statusCode).toBe(400);
        });

        it('應該包含原始錯誤', () => {
            const originalError = new Error('原始錯誤');
            const error = new YouTubeAPIError('包裝錯誤', 'WRAP_ERROR', 500, originalError);

            expect(error.originalError).toBe(originalError);
        });
    });

    describe('ErrorHandler', () => {
        it('應該是單例模式', () => {
            const instance1 = ErrorHandler.getInstance();
            const instance2 = ErrorHandler.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('應該正確處理一般錯誤', () => {
            const testError = new Error('測試錯誤');

            expect(() => {
                errorHandler.handleError(testError, '測試上下文', ErrorCodes.NETWORK_ERROR);
            }).toThrow(YouTubeAPIError);

            try {
                errorHandler.handleError(testError, '測試上下文', ErrorCodes.NETWORK_ERROR);
            } catch (error) {
                expect(error).toBeInstanceOf(YouTubeAPIError);
                expect((error as YouTubeAPIError).code).toBe(ErrorCodes.NETWORK_ERROR);
                expect((error as YouTubeAPIError).message).toContain('Network connection error');
                expect((error as YouTubeAPIError).message).toContain('測試上下文');
            }
        });

        it('應該正確處理 YouTubeAPIError', () => {
            const youtubeError = new YouTubeAPIError('YouTube 錯誤', ErrorCodes.INIT_DATA_ERROR);

            expect(() => {
                errorHandler.handleError(youtubeError, '測試上下文');
            }).toThrow(YouTubeAPIError);

            try {
                errorHandler.handleError(youtubeError, '測試上下文');
            } catch (error) {
                expect(error).toBe(youtubeError);
                expect((error as YouTubeAPIError).code).toBe(ErrorCodes.INIT_DATA_ERROR);
            }
        });

        it('應該正確處理 Axios 錯誤', () => {
            const axiosError = {
                isAxiosError: true,
                response: { status: 429 },
                message: 'Rate limit exceeded'
            };

            expect(() => {
                errorHandler.handleError(axiosError, '測試上下文', ErrorCodes.RATE_LIMIT_ERROR);
            }).toThrow(YouTubeAPIError);

            try {
                errorHandler.handleError(axiosError, '測試上下文', ErrorCodes.RATE_LIMIT_ERROR);
            } catch (error) {
                expect(error).toBeInstanceOf(YouTubeAPIError);
                expect((error as YouTubeAPIError).code).toBe(ErrorCodes.RATE_LIMIT_ERROR);
                expect((error as YouTubeAPIError).statusCode).toBe(429);
                expect((error as YouTubeAPIError).message).toContain('Rate limit exceeded');
            }
        });

        it('應該支援自定義錯誤記錄器', () => {
            const mockLogger = jest.fn();
            errorHandler.setErrorLogger(mockLogger);

            const testError = new Error('測試錯誤');

            try {
                errorHandler.handleError(testError, '測試上下文', ErrorCodes.PARSE_ERROR);
            } catch (error) {
                // 預期會拋出錯誤
            }

            expect(mockLogger).toHaveBeenCalledWith(expect.any(YouTubeAPIError));
            expect(mockLogger).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ErrorCodes.PARSE_ERROR,
                    message: expect.stringContaining('Data parsing error')
                })
            );
        });

        it('應該創建自定義錯誤', () => {
            const originalError = new Error('原始錯誤');
            const customError = errorHandler.createError(
                '自定義錯誤訊息',
                ErrorCodes.INVALID_VIDEO_ID,
                404,
                originalError
            );

            expect(customError).toBeInstanceOf(YouTubeAPIError);
            expect(customError.message).toBe('自定義錯誤訊息');
            expect(customError.code).toBe(ErrorCodes.INVALID_VIDEO_ID);
            expect(customError.statusCode).toBe(404);
            expect(customError.originalError).toBe(originalError);
        });
    });

    describe('ErrorCodes', () => {
        it('應該包含所有預期的錯誤代碼', () => {
            expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
            expect(ErrorCodes.INIT_DATA_ERROR).toBe('INIT_DATA_ERROR');
            expect(ErrorCodes.PLAYER_DATA_ERROR).toBe('PLAYER_DATA_ERROR');
            expect(ErrorCodes.INVALID_PLAYLIST).toBe('INVALID_PLAYLIST');
            expect(ErrorCodes.INVALID_VIDEO_ID).toBe('INVALID_VIDEO_ID');
            expect(ErrorCodes.INVALID_CHANNEL_ID).toBe('INVALID_CHANNEL_ID');
            expect(ErrorCodes.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
            expect(ErrorCodes.PARSE_ERROR).toBe('PARSE_ERROR');
            expect(ErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
        });
    });
}); 
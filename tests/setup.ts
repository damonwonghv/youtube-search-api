// 測試環境設定
import nock from 'nock';

// 設定 nock 為測試模式
beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
  nock.restore();
});

afterEach(() => {
  nock.cleanAll();
});

// 全域測試超時設定
jest.setTimeout(30000);

// 抑制 console.error 在測試中的輸出
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 
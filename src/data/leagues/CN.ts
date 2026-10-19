import type { RawLeague } from '../schema';

export const leagues: RawLeague[] = [
  { id: 'CN1', ko: '중국 슈퍼리그', en: 'Chinese Super League', tier: 1, lvl: 3, top: 62, bottom: 48, up: 0, down: 2, cup: '중국 FA컵', clubs: 'Shanghai Port|상하이;Shanghai Shenhua|상하이;Beijing Guoan|베이징;Chengdu Rongcheng|청두;Shandong Taishan|지난;Zhejiang FC|항저우;Tianjin Jinmen Tiger|톈진;Henan FC|정저우;Wuhan Three Towns|우한;Changchun Yatai|창춘;Qingdao West Coast|칭다오;Qingdao Hainiu|칭다오;Meizhou Hakka|메이저우;Dalian Yingbo|다롄;Shenzhen Peng City|선전;Yunnan Yukun|쿤밍' },
  { id: 'CN2', ko: '중국 갑급리그', en: 'China League One', tier: 2, lvl: 2, top: 48, bottom: 38, up: 3, down: 3, cup: '중국 FA컵', clubs: 'Guangzhou FC|광저우;Liaoning Tieren|선양;Shaanxi Union|시안;Nantong Zhiyun|난퉁;Suzhou Dongwu|쑤저우;Shijiazhuang Gongfu|스자좡;Jiangxi Lushan|난창;Heilongjiang Ice City|하얼빈;Foshan Nanshi|포산;Guangxi Pingguo|난닝;Qingdao Red Lions|칭다오;Wuxi Wugou|우시;Xinjiang Tianshan|우루무치;Dandong Tengyue|단둥;Sichuan Jiuniu|청두;Zibo Cuju|쯔보;Chongqing Tonglianglong|충칭;Guizhou Zhucheng|구이양' }
];

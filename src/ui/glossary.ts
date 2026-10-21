export const GLOSSARY: Record<string, { label: string; text: string }> = {
  ovr: { label: '오버롤', text: '포지션에 맞춰 가중한 종합 능력치예요. 같은 능력이라도 포지션에 따라 값이 달라져요.' },
  level: { label: '수준', text: '구단과 리그의 등급이에요. 하부리그, 프로 하위권, 프로 중위권, 빅리그, 월드 빅클럽 순으로 높아져요.' },
  standing: { label: '입지', text: '감독과 구단 안에서 내 자리가 얼마나 단단한지를 나타내요. 낮으면 경질될 수 있어요.' },
  fame: { label: '명성', text: '세상이 나를 얼마나 아는지를 나타내요. 이적 제안과 협상, 수입에 영향을 줘요.' },
  sharp: { label: '경기 감각', text: '최근 얼마나 자주 뛰었는지에 따라 오르내려요. 낮으면 경기에서 실력이 덜 나와요.' },
  fee: { label: '이적료', text: '다른 구단이 나를 데려오며 현재 구단에 내는 돈이에요. 계약 기간이 짧을수록 줄어들어요.' },
  buyout: { label: '바이아웃', text: '계약서에 적어 둔 금액이에요. 이 금액을 내면 현재 구단의 동의 없이도 이적할 수 있어요.' }
};

export type TermId = keyof typeof GLOSSARY;

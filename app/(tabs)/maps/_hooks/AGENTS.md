- maps/\_hooks 개발 예정 문서

아직 이 디렉터리에 실제 훅 파일은 없음. app/(tabs)/maps/index.tsx 829줄에서 분리 예정인 로직을 미리 기록해둔 문서.

- 분리 기준

컴포넌트 분리 기준은 독립적으로 동작 가능한 기능인가? 를 중점으로 봄. app/(tabs)/maps/favorites/\_components/group-edit-sheet.tsx가 이 기준의 예시 - 자기 데이터 조회와 mutation과 상태를 스스로 다 가지고 있어서 다른 화면에 놔도 혼자 동작함. 단순히 줄 수를 줄이려고 쪼개는건 아님

분리 대상, 독립적이라 훅으로 뺄 것

useMapSheetStack - index.tsx의 바텀시트 스택 상태머신 전체 - 퍼사드 패턴 적용 가능

useUserLocationTracking - 사용자 위치 추적 로직

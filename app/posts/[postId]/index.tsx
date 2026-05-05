import { Footer } from '@/app/_components/footer';
import { HeartIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export default function BoardDetailScreen() {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');

  function onPostLikeClick(): void {}

  function onCommentSubmitClick(): void {}

  function onCommentDeleteClick(): void {}

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* header */}
      <View className="border-grey-02 border-b px-4 pb-4 pt-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start">
          <ChevronLeft className="text-black" />
          <Text className="text-body03 text-black">이전</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 flex-col gap-5 py-5">
        {/* content */}
        <View className="flex-col gap-1 px-4">
          <Text className="text-body02 text-black">{POST.title}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-grey-40 text-body05">{POST.createdAt}</Text>
              <Svg width="1" height="16" viewBox="0 0 1 16" fill="none">
                <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
              </Svg>
              <Text className="text-grey-40 text-body05">{POST.author}</Text>
            </View>
            <View className="flex-row items-center">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15.1504 6.2002C16.8694 6.20041 18.2996 7.64387 18.2998 9.47168C18.2998 11.4994 17.1803 13.4976 15.1504 15.418C14.4671 16.064 13.7253 16.6363 12.9785 17.1572C12.7143 17.3408 12.4739 17.5025 12.2627 17.6348V17.6357C12.0855 17.7468 12.0482 17.7738 12.0049 17.7988C12.0036 17.799 12.002 17.7998 12 17.7998C11.9974 17.7998 11.9954 17.7991 11.9941 17.7988C11.9512 17.7739 11.9135 17.7462 11.7373 17.6357V17.6348C11.6318 17.5687 11.5188 17.4958 11.3994 17.416L11.0215 17.1572C10.2747 16.6363 9.53289 16.064 8.84961 15.418C6.81974 13.4976 5.7002 11.4994 5.7002 9.47168C5.70036 7.64387 7.13056 6.20041 8.84961 6.2002C9.87935 6.2002 10.8505 6.73691 11.4531 7.57715L12.0098 8.35449L12.582 7.58887C13.214 6.74439 14.1986 6.2002 15.1504 6.2002Z"
                  stroke="#8BC7FF"
                  stroke-width="1.4"
                />
              </Svg>
              <Text className="text-body05 text-grey-40">{POST.likeCount}</Text>
              <Svg width="1" height="16" viewBox="0 0 1 16" fill="none" className="ms-2">
                <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
              </Svg>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="ms-1.5">
                <Path
                  d="M12 5.5C8.1514 5.5 5 8.38407 5 11.9875C5 13.1207 5.3094 14.2221 5.8967 15.1859C6.2124 15.7042 6.2418 16.4416 5.7658 17.4385C5.5495 17.8912 5.847 18.4275 6.3342 18.4751C7.2841 18.5681 8.0863 18.4037 9.1783 17.9344C10.0477 18.2833 11.0312 18.4751 12 18.4751C15.8486 18.4751 19 15.5903 19 11.9875C19 8.38407 15.8486 5.5 12 5.5ZM12 6.94167C15.1101 6.94167 17.6 9.22096 17.6 11.9875C17.6 14.7541 15.1101 17.0334 12 17.0334C11.1047 17.0334 10.2409 16.8503 9.4625 16.4928C9.2826 16.4099 9.07401 16.4113 8.89341 16.4928C8.24941 16.7833 7.88469 16.9419 7.40659 17.0111C7.67119 16.0704 7.4766 15.0742 7.0783 14.4204C6.6289 13.6829 6.4 12.8453 6.4 11.9875C6.4 9.22096 8.8899 6.94167 12 6.94167ZM9.2 11.2667C8.8136 11.2667 8.5 11.5889 8.5 11.9875C8.5 12.3854 8.8136 12.7084 9.2 12.7084C9.5864 12.7084 9.9 12.3854 9.9 11.9875C9.9 11.5889 9.5864 11.2667 9.2 11.2667ZM12 11.2667C11.6136 11.2667 11.3 11.5889 11.3 11.9875C11.3 12.3854 11.6136 12.7084 12 12.7084C12.3864 12.7084 12.7 12.3854 12.7 11.9875C12.7 11.5889 12.3864 11.2667 12 11.2667ZM14.8 11.2667C14.4136 11.2667 14.1 11.5889 14.1 11.9875C14.1 12.3854 14.4136 12.7084 14.8 12.7084C15.1864 12.7084 15.5 12.3854 15.5 11.9875C15.5 11.5889 15.1864 11.2667 14.8 11.2667Z"
                  fill="#8BC7FF"
                />
              </Svg>
              <Text className="text-body05 text-grey-40">{POST.commentCount}</Text>
            </View>
          </View>
        </View>
        <View className="px-4">
          <Text className="text-body05 text-black">{POST.content}</Text>
        </View>

        {/* like button */}
        <View className="px-5">
          <TouchableOpacity
            onPress={() => onPostLikeClick()}
            className="flex-row items-center self-start">
            <Text className="text-body04 text-grey-40">좋아요</Text>
            <HeartIcon filled={POST.isLiked} className="text-grey-20" />
          </TouchableOpacity>
        </View>
        <View className="border-grey-02 border-b" />

        {/* comments section */}
        {false ? (
          <View className="flex-col gap-5 px-4">
            <Text className="text-body02 text-black">댓글</Text>
            <View className="border-grey-10 rounded-sm border p-10">
              <Text className="text-body05 text-grey-30 text-center">
                로그인 후 이용 가능합니다
              </Text>
            </View>
            <Button>
              <Text>Thingo 로그인하기</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-col gap-5 px-4">
            <View className="flex-col gap-2">
              <Text className="text-body02 text-black">댓글</Text>
              <View className="bg-grey-02 relative rounded-lg px-3">
                <TextInput
                  multiline
                  textAlignVertical="top"
                  className="text-body05 text-grey-40 pr-8"
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="댓글을 입력하세요"
                  placeholderTextColor="#909499"
                />
                <TouchableOpacity
                  onPress={() => onCommentSubmitClick()}
                  className="absolute bottom-2 right-2">
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="12" fill="#CDD0D4" />
                    <Path
                      d="M17.993 11.0312C18.2782 11.3198 18.2782 11.7877 17.993 12.0764C17.7079 12.365 17.2456 12.365 16.9604 12.0764L12.7302 7.79445V18.2946C12.7302 18.7029 12.4033 19.0338 12 19.0338C11.5967 19.0338 11.2698 18.7029 11.2698 18.2946V7.79445L7.03956 12.0764C6.7544 12.365 6.29215 12.365 6.00697 12.0764C5.7218 11.7877 5.7218 11.3198 6.00697 11.0312L12 4.96484L17.993 11.0312Z"
                      fill="white"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
              <Text className="text-caption02 text-grey-40 text-right">
                {commentText.length}/300
              </Text>
            </View>

            {/* comments */}
            {COMMENTS.map((comment) => (
              <View key={comment.id} className="flex-col gap-2.5">
                <View className="flex-row items-center gap-3">
                  <View className="bg-grey-30 h-10 w-10 rounded-full" />
                  <View className="flex-1 flex-col gap-0.5">
                    <Text className="text-body04 text-black">{comment.author}</Text>
                    <Text className="text-caption02 text-grey-40">{comment.createdAt}</Text>
                  </View>
                  {comment.isOwner && (
                    <TouchableOpacity onPress={() => onCommentDeleteClick()}>
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Circle cx="12" cy="12" r="8" fill="#CDD0D4" />
                        <Path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M14.6044 8.21967C14.8972 7.92678 15.372 7.92678 15.6649 8.21967C15.9577 8.51257 15.9578 8.98735 15.6649 9.28022L13.0028 11.9423L15.6649 14.6044C15.9578 14.8973 15.9578 15.3721 15.6649 15.665C15.372 15.9576 14.8972 15.9578 14.6044 15.665L11.9422 13.0029L9.28014 15.665C8.98725 15.9577 8.51244 15.9578 8.21959 15.665C7.92675 15.3721 7.92685 14.8973 8.21959 14.6044L10.8817 11.9423L8.21959 9.28022C7.92691 8.9874 7.92701 8.51254 8.21959 8.21967C8.51244 7.92682 8.98724 7.9269 9.28014 8.21967L11.9422 10.8818L14.6044 8.21967Z"
                          fill="white"
                        />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-body05 w-full text-black">{comment.content}</Text>
                <View className="flex-row items-center">
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M10.0104 14.6006C10.0078 14.6011 10.0039 14.6016 9.99963 14.6016C9.99481 14.6015 9.99045 14.6012 9.98792 14.6006C9.9508 14.5803 9.92123 14.5579 9.77112 14.4678C9.59506 14.3622 9.39456 14.2333 9.17444 14.0869H9.17542C8.55279 13.6712 7.93408 13.2144 7.36487 12.6992C5.6723 11.1662 4.74979 9.58096 4.74963 7.9834C4.74963 6.56235 5.91811 5.39763 7.37463 5.39746C8.24359 5.39746 9.05361 5.83161 9.55139 6.49609L10.0084 7.10645L10.4781 6.50586C11.0004 5.83781 11.821 5.39758 12.6246 5.39746C14.0813 5.39746 15.2496 6.56224 15.2496 7.9834C15.2495 9.58107 14.3272 11.1661 12.6344 12.6992C12.2074 13.0857 11.753 13.4395 11.2897 13.7676L10.8248 14.0869C10.6048 14.2332 10.4041 14.3623 10.2281 14.4678L10.0114 14.6006H10.0104Z"
                      stroke="#8BC7FF"
                      stroke-width="1.16667"
                    />
                  </Svg>
                  <Text className="text-caption02 text-grey-40">{comment.likeCount}</Text>
                  <Svg width="1" height="14" viewBox="0 0 1 14" fill="none" className="ms-2">
                    <Line x1="0.5" y1="2.18557e-08" x2="0.499999" y2="14" stroke="#AEB2B6" />
                  </Svg>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="ms-1.5">
                    <Path
                      d="M9.99996 4.58398C6.79279 4.58398 4.16663 6.98738 4.16663 9.99026C4.16663 10.9346 4.42446 11.8524 4.91388 12.6556C5.17696 13.0875 5.20146 13.702 4.80479 14.5327C4.62454 14.91 4.87246 15.3569 5.27846 15.3965C6.07005 15.474 6.73854 15.3371 7.64854 14.946C8.37304 15.2368 9.19263 15.3965 9.99996 15.3965C13.2071 15.3965 15.8333 12.9926 15.8333 9.99026C15.8333 6.98738 13.2071 4.58398 9.99996 4.58398ZM9.99996 5.78538C12.5917 5.78538 14.6666 7.68479 14.6666 9.99026C14.6666 12.2957 12.5917 14.1951 9.99996 14.1951C9.25388 14.1951 8.53404 14.0426 7.88538 13.7446C7.73546 13.6755 7.56163 13.6767 7.41113 13.7446C6.87447 13.9867 6.57054 14.1189 6.17212 14.1765C6.39262 13.3926 6.23046 12.5625 5.89854 12.0176C5.52404 11.4031 5.33329 10.7051 5.33329 9.99026C5.33329 7.68479 7.40821 5.78538 9.99996 5.78538ZM7.66663 9.38957C7.34463 9.38957 7.08329 9.65808 7.08329 9.99026C7.08329 10.3219 7.34463 10.591 7.66663 10.591C7.98863 10.591 8.24996 10.3219 8.24996 9.99026C8.24996 9.65808 7.98863 9.38957 7.66663 9.38957ZM9.99996 9.38957C9.67796 9.38957 9.41663 9.65808 9.41663 9.99026C9.41663 10.3219 9.67796 10.591 9.99996 10.591C10.322 10.591 10.5833 10.3219 10.5833 9.99026C10.5833 9.65808 10.322 9.38957 9.99996 9.38957ZM12.3333 9.38957C12.0113 9.38957 11.75 9.65808 11.75 9.99026C11.75 10.3219 12.0113 10.591 12.3333 10.591C12.6553 10.591 12.9166 10.3219 12.9166 9.99026C12.9166 9.65808 12.6553 9.38957 12.3333 9.38957Z"
                      fill="#8BC7FF"
                    />
                  </Svg>
                  <Text className="text-caption02 text-grey-40">{comment.replyCount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <Footer />
    </ScrollView>
  );
}

// dummy
const COMMENTS = [
  {
    id: 1,
    author: '이서연',
    createdAt: '2026.04.25 09:12',
    content:
      '요즘 세상 돌아가는 거 보면 진짜 어이없음. 뉴스 켜면 맨날 똑같은 얘기고, 전문가라는 사람들은 나와서 서로 반대 말만 하고, 댓글창은 또 난리고. 근데 신기한 건 다들 이렇게 피곤하다고 하면서 또 뉴스 봄. 나 포함.',
    likeCount: 14,
    replyCount: 3,
    isOwner: false,
  },
  {
    id: 2,
    author: '박준혁',
    createdAt: '2026.04.25 10:34',
    content:
      'AI 에이전트 얘기 진짜 공감돼요. 저도 요즘 개발할 때 방향 제시만 하고 나머지는 AI한테 맡기는 경우가 많아졌어요.',
    likeCount: 7,
    replyCount: 1,
    isOwner: true,
  },
  {
    id: 3,
    author: '최다은',
    createdAt: '2026.04.25 11:58',
    content: '좋은 글 잘 읽었습니다. 결국 AI를 어떻게 활용하느냐의 문제라는 말이 가장 와닿네요.',
    likeCount: 5,
    replyCount: 0,
    isOwner: false,
  },
];

const POST = {
  title: '2026년, AI는 이미 "도구"가 아니다 — 우리가 몰랐던 변화의 속도',
  author: '김민준',
  createdAt: '2026.04.25',
  likeCount: 42,
  commentCount: 8,
  content: `2026년, AI는 이미 '도구'가 아니다 — 우리가 몰랐던 변화의 속도
요즘 들어 부쩍 이런 말을 자주 듣는다. "AI가 내 일자리를 빼앗는 건 아닐까?" 혹은 반대로 "AI, 써봤는데 별거 없던데?" 두 반응 모두 이해한다. 하지만 2026년 현재, 이 두 시선 모두 조금씩 빗나가 있다. AI는 이미 우리의 일상과 산업 깊숙이 스며들었고, 그 방식은 우리가 상상했던 것보다 훨씬 조용하고, 훨씬 빠르다.

"AI 시대가 온다"는 말은 이미 과거형이다
2023년, ChatGPT가 세상에 나왔을 때 많은 사람들은 이것을 '신기한 챗봇' 정도로 여겼다. 몇 가지 질문을 던져보고, 틀린 답변에 실망하고, 결국 탭을 닫았다. 그로부터 불과 3년이 지난 지금, 상황은 완전히 달라졌다.
전 세계 수억 명의 사람들이 매일 AI와 대화하며 글을 쓰고, 코드를 짜고, 의사결정을 내린다. 기업들은 고객 서비스, 법률 검토, 재무 분석, 마케팅 카피 작성에 AI를 전면 도입했다. 병원에서는 AI가 영상 판독을 보조하고, 법원에서는 판례 분석에 AI가 활용된다. 이제 AI는 "쓸 것인가 말 것인가"의 문제가 아니라 "어떻게 잘 쓸 것인가"의 문제가 됐다.

에이전트 AI: 단순 대화를 넘어선 '행동하는 AI'
2025~2026년의 가장 큰 변화는 단연 **AI 에이전트(Agentic AI)**의 부상이다. 기존의 AI가 질문에 답하는 수동적인 도구였다면, 에이전트 AI는 스스로 계획을 세우고, 도구를 사용하고, 결과를 검토하며 목표를 달성한다.
예를 들어 이런 식이다. 당신이 "다음 달 도쿄 출장 준비해줘"라고 말하면, 에이전트 AI는 항공권을 검색하고, 숙소를 비교하고, 일정을 정리해 캘린더에 등록하고, 필요한 서류 체크리스트까지 만들어 이메일로 보내준다. 사람이 중간에 개입하지 않아도 된다.
이 기술은 이미 소프트웨어 개발 분야에서 두드러지게 나타나고 있다. 개발자들은 AI에게 기능 구현을 맡기고, AI는 코드를 작성하고 테스트하고 오류를 수정하는 전 과정을 자율적으로 수행한다. 개발자의 역할은 '코드를 짜는 사람'에서 '방향을 제시하고 결과를 검토하는 사람'으로 빠르게 이동하고 있다.

멀티모달의 일상화: 텍스트, 이미지, 소리, 영상이 하나로
또 하나의 거대한 흐름은 멀티모달(Multimodal) AI의 일상화다. 이제 AI는 텍스트만 처리하지 않는다. 사진을 보고 상황을 설명하고, 음성을 듣고 감정을 분석하며, 영상을 보고 요약문을 만든다. 반대로 텍스트 설명만으로 고품질의 이미지와 영상을 생성하기도 한다.
이 변화가 가져온 파급력은 콘텐츠 산업에서 가장 극적으로 드러났다. 1인 크리에이터가 AI를 활용해 드라마 수준의 영상을 혼자 제작하고, 소규모 스타트업이 대형 광고 대행사와 맞먹는 품질의 광고 영상을 만들어낸다. 진입장벽이 낮아지면서 창작의 민주화가 빠르게 진행되고 있다.
물론 이 과정에서 저작권, 딥페이크 악용, 가짜 정보 생성 같은 어두운 면도 함께 부상하고 있다. 기술의 속도를 제도가 따라가지 못하는 전형적인 문제다.

AI와 일자리: 공포보다 복잡한 현실
"AI가 일자리를 빼앗는다"는 공포는 여전히 유효하지만, 현실은 더 복잡하다. 단순 반복 업무는 분명히 AI로 대체되고 있다. 하지만 동시에, AI를 잘 활용하는 사람은 혼자서 이전에 팀 전체가 해내던 일을 처리할 수 있게 됐다. 생산성의 격차가 개인 단위에서 극적으로 벌어지고 있는 것이다.
직종별로 보면 영향은 제각각이다. 회계사, 번역가, 콜센터 직원처럼 규칙 기반의 반복 업무가 많은 직종은 빠르게 자동화 압력을 받고 있다. 반면 인간 고유의 감성, 윤리 판단, 물리적 상호작용이 필요한 직종 — 사회복지사, 간호사, 배관공, 교사 — 은 당분간 AI의 위협으로부터 비교적 안전하다.
중요한 건 "AI에게 대체될 것인가"가 아니라 "AI를 활용할 수 있는가"다. 이미 많은 기업이 채용 공고에 'AI 툴 활용 능력'을 필수 역량으로 명시하기 시작했다.

소버린 AI와 규제: 각국의 AI 주도권 경쟁
기술 패권 경쟁도 빼놓을 수 없다. 미국과 중국을 중심으로 AI 주도권 경쟁이 치열하게 벌어지는 가운데, 유럽은 세계 최초의 포괄적 AI 규제법인 EU AI Act를 본격 시행하며 '규제 선도국'의 역할을 자처하고 있다. 한국, 일본, 인도 등도 자국 언어와 문화에 특화된 AI 모델 개발에 박차를 가하고 있다.
이른바 소버린 AI(Sovereign AI) — 자국의 데이터와 인프라로 운영되는 독립적 AI — 가 국가 전략의 핵심 키워드로 떠올랐다. 단순한 기술 경쟁을 넘어, AI는 이제 국가 안보와 경제 자립의 문제가 됐다.

우리에게 필요한 것: 속도보다 방향
변화의 속도는 분명 숨 막힐 정도로 빠르다. 하지만 속도에 압도되어서는 안 된다. 중요한 건 방향이다.
AI가 더 강력해질수록, 우리가 스스로에게 던져야 할 질문도 깊어진다. 이 기술을 누가 통제하는가. 누가 혜택을 받고 누가 소외되는가. AI의 판단을 어디까지 믿을 것인가. 기술의 발전을 환영하되, 그것을 비판적으로 바라보는 시선을 잃지 않는 것 — 그것이 지금 이 시대를 살아가는 우리 모두에게 필요한 태도일 것이다.
AI 시대는 이미 왔다. 이제 문제는 우리가 이 시대를 어떻게 살아갈 것인가다.`,
  isLiked: true,
};

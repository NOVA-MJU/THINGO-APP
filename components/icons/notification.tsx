import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type NotificationIconProps = {
  size?: number;
  showBadge?: boolean;
  className?: string;
};

export default function NotificationIcon({
  size = 24,
  showBadge = false,
  className = 'text-grey-80',
}: NotificationIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M18.4306 14.6826C18.1456 14.2273 17.9944 13.701 17.9941 13.1639V9.18658C17.9941 7.5458 17.3423 5.97222 16.1821 4.81201C15.0219 3.6518 13.4483 3 11.8075 3C10.1667 3 8.59313 3.6518 7.43292 4.81201C6.27271 5.97222 5.62091 7.5458 5.62091 9.18658V13.162C5.62099 13.6998 5.46972 14.2267 5.1844 14.6826L4.14519 16.3446C4.05482 16.4891 4.0048 16.6553 4.00033 16.8257C3.99585 16.9962 4.03708 17.1647 4.11974 17.3138C4.20239 17.463 4.32346 17.5872 4.47036 17.6738C4.61727 17.7603 4.78466 17.806 4.95516 17.806H18.6598C18.8303 17.806 18.9977 17.7603 19.1446 17.6738C19.2915 17.5872 19.4126 17.463 19.4953 17.3138C19.5779 17.1647 19.6191 16.9962 19.6147 16.8257C19.6102 16.6553 19.5602 16.4891 19.4698 16.3446L18.4306 14.6826Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.06543 18.5234C9.22876 19.2341 9.58886 19.8626 10.0894 20.3096C10.5899 20.7585 11.2031 21.0011 11.8335 21.0011C12.4639 21.0011 13.0771 20.7585 13.5776 20.3105C14.0781 19.8616 14.4373 19.2341 14.6015 18.5234"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {showBadge ? <Circle cx="18" cy="4" r="3" fill="#f45353" /> : null}
    </StyledSvg>
  );
}

import { IconFirstWinnerBadge, IconSecondWinnerBadge, IconThirdWinnerBadge } from '@/components/Icons';

export default {
  winner1: {
    badge: <IconFirstWinnerBadge className="mx-auto" />,
    rank: '1st',
  },
  winner2: {
    badge: <IconSecondWinnerBadge className="mx-auto" />,
    rank: '2th',
  },
  winner3: {
    badge: <IconThirdWinnerBadge className="mx-auto" />,
    rank: '3th',
  },
};

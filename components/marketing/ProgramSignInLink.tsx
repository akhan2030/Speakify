"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  loginPathForCourseSlug,
  loginPathFromPathname,
} from "@/lib/courses/loginPaths";

type Props = {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  /** When set, sign-in returns to this course's dashboard instead of inferring from the URL */
  courseSlug?: string;
};

export default function ProgramSignInLink({
  className,
  onClick,
  children = "Sign in",
  courseSlug,
}: Props) {
  const pathname = usePathname();
  const href = courseSlug
    ? loginPathForCourseSlug(courseSlug)
    : loginPathFromPathname(pathname ?? "/");

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

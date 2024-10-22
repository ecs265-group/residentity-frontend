import { Circles as Cs } from "react-loader-spinner";
import { InfinitySpin as IS } from "react-loader-spinner";
import { ThreeDots as TD } from "react-loader-spinner";

export function Circles() {
  return (
    <Cs
      height='80'
      width='80'
      color='var(--c2)'
      ariaLabel='circles-loading'
      wrapperStyle={{}}
      wrapperClass=''
      visible={true}
    />
  );
}

export function InfinitySpin() {
  return (
    <IS
      height='80'
      width='80'
      color='var(--c2)'
      ariaLabel='infinity-spin-loading'
      wrapperStyle={{}}
      wrapperClass=''
      visible={true}
    />
  );
}

export function ThreeDots() {
  return (
    <TD
      height='80'
      width='80'
      color='var(--c2)'
      ariaLabel='three-dots-loading'
      wrapperStyle={{}}
      wrapperClass=''
      visible={true}
    />
  );
}

import Image from "next/image";
import img1 from "@/assets/img1.png";

export default function Home() {
  return (
    <div className='w-full h-full flex flex-row items-center justify-center p-20 gap-56'>
      <div>
        <h1 className='text-6xl text-white font-semibold p-4'>ResIdentity</h1>
        <h2 className='text-xl text-c2 font-medium p-4'>
          A Decentralized Document <br /> e-Signer and Verifier
        </h2>
        <p className='text-c2 text-lg p-4'>
          Powered by{" "}
          <a
            href='https://resilientdb.incubator.apache.org/'
            target='_blank'
            className='inline-flex justify-center gap-1 leading-4 hover:underline'
          >
            <span>ResilientDB</span>
            <svg aria-hidden='true' height='7' viewBox='0 0 6 6' width='7' className='opacity-70'>
              <path
                d='M1.25215 5.54731L0.622742 4.9179L3.78169 1.75597H1.3834L1.38936 0.890915H5.27615V4.78069H4.40513L4.41109 2.38538L1.25215 5.54731Z'
                fill='currentColor'
              ></path>
            </svg>
          </a>
        </p>
      </div>
      <div>
        <Image src={img1.src} alt='ResIdentity Logo' width={500} height={600} />
      </div>
    </div>
  );
}

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
      </div>
      <div>
        <Image
          src={img1.src}
          alt='ResIdentity Logo'
          width={500}
          height={600}
        />
      </div>
    </div>
  );
}

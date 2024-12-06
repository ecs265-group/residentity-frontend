"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDots as Loader } from "@/components/loaders";

export default function Register() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    verifyPassword: '',
    firstName: '',
    lastName: '',
    organization: '',
    city: '',
    state: '',
    countryCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {
    // Enable button only if email and password are valid
    if (registerForm.email === "" || registerForm.password === "" || !validateEmail(registerForm.email)) {
      setButtonEnabled(false);
    } else {
      setButtonEnabled(true);
    }
  }, [registerForm.email, registerForm.password]);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setRegisterForm((prevForm) => ({
      ...prevForm,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
        }),
      });
      if (res.status === 200) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mt-20 mx-auto w-1/3 flex flex-col items-center justify-center text-center border bg-c0 gap-4 rounded-lg border-white/15 p-6'>
      <h1 className='text-3xl text-white font-semibold p-4'>Register</h1>
      <form className='w-2/3 flex flex-col gap-2'>
        {[
          { id: 'email', type: 'email', placeholder: 'Email' },
          { id: 'password', type: 'password', placeholder: 'Password' },
          { id: 'verifyPassword', type: 'password', placeholder: 'Re-enter Password' },
          { id: 'firstName', type: 'text', placeholder: 'First Name' },
          { id: 'lastName', type: 'text', placeholder: 'Last Name' },
          { id: 'organization', type: 'text', placeholder: 'Organization' },
          { id: 'city', type: 'text', placeholder: 'City' },
          { id: 'state', type: 'text', placeholder: 'State' },
          { id: 'countryCode', type: 'text', placeholder: 'Country Code' },
        ].map((field) => (
          <div className="flex flex-col" key={field.id}>
            <label htmlFor={field.id} className='flex text-c2 text-sm font-medium'>
              {field.id.charAt(0).toUpperCase() + field.id.slice(1)}
            </label>
            <input
              type={field.type}
              id={field.id}
              className='p-2 rounded-md text-white bg-c0 border border-white/15 placeholder-c2/50 text-sm focus:outline-none'
              placeholder={field.placeholder}
              value={registerForm[field.id]}
              onChange={handleInputChange}
              onKeyUp={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
            />
          </div>
        ))}
        <button
          disabled={!buttonEnabled}
          className={`h-9 px-4 py-2 my-1 w-full flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors
							focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border
							bg-c1 text-white border-c2 cursor-pointer
							hover:bg-white hover:text-c0
							disabled:bg-c1 disabled:text-c2 disabled:cursor-not-allowed`}
          onClick={(e) => handleSubmit(e)}
        >
          Register
        </button>
      </form>
      {loading ? (
        <div className='flex justify-center mt-2'>
          <Loader />
        </div>
      ) : null}
      {error ? <div className='text-red-500/90 text-sm text-center'>{error}</div> : null}
    </div>
  );
}
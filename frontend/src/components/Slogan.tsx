interface SloganProps {
    text1: string;
    text2?: string; // Making text2 optional
  }
  
  const Slogan = ({ text1, text2 }: SloganProps) => {
    return (
      <div className="p-16 bg-gradient-to-tr from-gray-100 to-gray-200">
        <div className="container mx-auto px-4 pt-20 pb-10">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-5xl font-bold text-center text-gray-800">{text1}</h1>
            {text2 && <h2 className="text-2xl text-center text-gray-600 mt-4">{text2}</h2>}
          </div>
        </div>
      </div>
    );
  };
  
  export default Slogan;
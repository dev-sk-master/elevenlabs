
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Home</title>
      </Helmet>
      <div className="container text-center mt-5">
        Home page

        <div className="p-4">
          <Link to="/speech-to-text" className="block text-blue-600 hover:underline mb-2">
            Speech to Text
          </Link>
          <br/>
          <Link to="/conversational-ai" className="block text-blue-600 hover:underline">
            Conversational AI
          </Link>
        </div>



      </div>


    </>
  );
};

export default Home;

import Register from './component/Register'

const AuthPage = () => {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <section className="w-full max-w-xl">
        <Register />
      </section>
    </main>
  );
};
export default AuthPage;
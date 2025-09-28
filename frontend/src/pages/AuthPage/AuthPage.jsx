import Register from './component/Register'

const AuthPage = () => {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <section className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Create an Account</h1>
        <Register />
      </section>
    </main>
  );
};
export default AuthPage;
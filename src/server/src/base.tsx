export const BaseHtml = ({ children, username }: { children: JSX.Element |undefined | {}; username?: string }) => {
// This line exports the component named BaseHtml so it can be imported and used elsewhere in your code.
// the component expects a single prop called children, which can either be undefined or an object.

	return (
		<html lang="en">
		<head>
			<meta charset="utf-8" />
			<meta
				name="viewport"
				content="width=device-width, initial-scale=1.0"
			/>
			<title>Smart lock</title>
			<script src="https://unpkg.com/htmx.org@1.9.6"></script>
			<script src="https://unpkg.com/htmx.org@1.9.11/dist/ext/ws.js"></script> 
			<link
				href="https://cdn.jsdelivr.net/npm/daisyui@4.10.1/dist/full.min.css"
				rel="stylesheet"
				type="text/css"
			/>
			<script src="https://cdn.tailwindcss.com"></script>
			<script></script>
		</head>

		<body id="main">
			<header>
				<nav class="navbar bg-primary text-primary-content">
					<div class="flex-1">
						<a class="btn btn-ghost normal-case text-xl">
							Door lock
						</a>
					</div>
					<div class="flex-none"> {/*logout button*/}
                        <a href="/logout" class="btn btn-square btn-ghost">
                            Logout
                        </a>
                    </div>
				</nav>
			</header>

			<main
				class="container mx-auto"
				style="display: flex; justify-content: center; align-items: center; height: 100vh;"
			>
				<div class="card w-96 bg-neutral text-neutral-content h-1/2">
					<div class="card-body items-center text-center h-full flex flex-col justify-center">
						<h1 class="text-3xl">Main entrance</h1>
						<div>
							<p>Apartment 3. 35</p>
							<p>Name: {username}</p>
						</div>
						{children}
					</div>
				</div>
			</main>
		</body>
	</html>
	);
};

export const Login = () => {
    return (
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>Login - Smart lock</title>
                <script src="https://unpkg.com/htmx.org@1.9.6"></script>
                <link
                    href="https://cdn.jsdelivr.net/npm/daisyui@4.10.1/dist/full.min.css"
                    rel="stylesheet"
                    type="text/css"
                />
                <script src="https://cdn.tailwindcss.com"></script>
            </head>

            <body id="main">
                <header>
                    <nav class="navbar bg-primary text-primary-content">
                        <div class="flex-1">
                            <a class="btn btn-ghost normal-case text-xl">
                                Door lock
                            </a>
                        </div>
                    </nav>
                </header>

                <main
                    class="container mx-auto"
                    style="display: flex; justify-content: center; align-items: center; height: 100vh;"
                >
                    <div class="card w-96 bg-neutral text-neutral-content h-1/2">
					<div class="flex flex-col items-center justify-center h-full">
                <h1 class="text-3xl font-bold mb-4">Login</h1>
                <form class="w-80" hx-post="/login" hx-target=".error" hx-swap="innerHTML">
                    <div class="mb-4">
                        <label for="username" class="block text-white-700">Username:</label>
                        <input type="text" id="username" name="username" class="form-input mt-1 block w-full" />
                    </div>
                    <div class="mb-6">
                        <label for="password" class="block text-white-700">Password:</label>
                        <input type="password" id="password" name="password" class="form-input mt-1 block w-full" />
                    </div>
                    <button type="submit" class="btn btn-primary px-6 py-3 w-full">Login</button>
                    <p class="text-red-500 mt-4 text-center error"></p>
                </form>
            </div>
                    </div>
                </main>
            </body>
        </html>
    );
};


  
  export const Logged = () => {
	return (
	  <BaseHtml>
		<h1>Login</h1>
		<p>You are already logged in</p>
		<a href="/logout">Logout</a>
	  </BaseHtml>
	);
  };
  
  export const NotLogged = () => {
	return (
	  <BaseHtml>
		<h1>Protected route</h1>
		<p>Hi, you are not logged in</p>
		<a href="/login">Login</a>
	  </BaseHtml>
	);
  };
  
  export const Protected = ({ username }: { username: string }) => {
	return (
	  <BaseHtml>
		<h1>Protected route</h1>
		<p>Hi {username}</p>
		<a href="/logout">Logout</a>
	  </BaseHtml>
	);
  };
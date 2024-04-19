export const BaseHtml = ({ children }: { children: undefined | {} }) => (
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

		<body>
			<header>
				<nav class="navbar bg-primary text-primary-content">
					<div class="flex-1">
						<a class="btn btn-ghost normal-case text-xl">
							Door lock
						</a>
					</div>
					<div class="flex-none">
						<button class="btn btn-square btn-ghost">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="w-6 h-6"
							>
								<path
									fill-rule="evenodd"
									d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</nav>
			</header>

			<main
				class="container mx-auto"
				style="display: flex; justify-content: center; align-items: center; height: 100vh;"
			>
				<div class="card w-96 bg-neutral text-neutral-content">
					<div class="card-body items-center text-center">
						<h1 class="text-3xl">Main entrance</h1>
						<div>
							<p>3. 35</p>
							<p>Sebastian Revsbech Christensen</p>
						</div>
						{children}
					</div>
				</div>
			</main>
		</body>
	</html>
);

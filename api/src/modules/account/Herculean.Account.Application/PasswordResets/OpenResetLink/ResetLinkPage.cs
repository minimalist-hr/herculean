using System.Text.Encodings.Web;

namespace Herculean.Account.Application.PasswordResets.OpenResetLink;

internal static class ResetLinkPage
{
    /// <summary>Opens the app by itself. The button is there for browsers that wait for a tap.</summary>
    public static string Render(string appLink)
    {
        string encodedLink = HtmlEncoder.Default.Encode(appLink);

        return $$"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="dark">
            <meta name="referrer" content="no-referrer">
            <meta http-equiv="refresh" content="0;url={{encodedLink}}">
            <title>Opening Herculean</title>
            <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
            :root{color-scheme:dark}
            body{margin:0;background:#050506}
            </style>
            </head>
            <body>
            <div style="min-height: 100dvh; box-sizing: border-box; display: flex; flex-direction: column; background: #050506; color: #F2F3F5; font-family: 'Chakra Petch', system-ui, sans-serif">
            <main style="flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 48px 16px 16px">
            <p style="margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #A9AEB6">Forgot password?</p>
            <h1 style="margin: 0; font-size: 32px; line-height: 1.05; font-weight: 700; letter-spacing: -0.01em">Opening Herculean</h1>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #A9AEB6">Nothing happening? Tap the button on the phone with Herculean.</p>
            </main>
            <div style="display: flex; flex-direction: column; padding: 12px 16px 28px; border-top: 1px solid #2C2F34; background: #0F1012">
            <a href="{{encodedLink}}" style="height: 48px; box-sizing: border-box; border-radius: 4px; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #1A55E6; color: #FFFFFF">Open Herculean</a>
            </div>
            </div>
            </body>
            </html>
            """;
    }
}

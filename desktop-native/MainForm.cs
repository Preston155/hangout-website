using System.Diagnostics;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DiscordRemake;

public sealed class MainForm : Form
{
    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill };
    private readonly string _appUrl;

    public MainForm()
    {
        _appUrl = Environment.GetEnvironmentVariable("APP_URL") ?? "https://prestonhq.com/?desktop=1";

        Text = "Discord Remake";
        Width = 1280;
        Height = 800;
        MinimumSize = new Size(960, 640);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(30, 31, 34);

        Controls.Add(_webView);
        Load += OnLoadAsync;
    }

    private async void OnLoadAsync(object? sender, EventArgs e)
    {
        Load -= OnLoadAsync;

        try
        {
            await _webView.EnsureCoreWebView2Async();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "WebView2 is required. Install it from:\nhttps://go.microsoft.com/fwlink/p/?LinkId=2124703\n\n" + ex.Message,
                "Discord Remake",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
            return;
        }

        var core = _webView.CoreWebView2;
        core.Settings.AreDefaultContextMenusEnabled = true;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsZoomControlEnabled = false;

        core.NewWindowRequested += (_, args) =>
        {
            args.Handled = true;
            if (!string.IsNullOrWhiteSpace(args.Uri))
            {
                Process.Start(new ProcessStartInfo(args.Uri) { UseShellExecute = true });
            }
        };

        await core.AddScriptToExecuteOnDocumentCreatedAsync(
            $"window.desktopApp = {{ isDesktop: true, version: '{AppVersion.Value}' }};");

        core.NavigationCompleted += (_, args) =>
        {
            if (!args.IsSuccess)
            {
                Text = "Discord Remake — connection issue";
            }
        };

        _webView.Source = new Uri(_appUrl);
    }
}
